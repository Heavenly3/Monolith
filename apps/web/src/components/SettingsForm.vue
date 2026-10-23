<script setup lang="ts">
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { computed, reactive, ref, watch } from 'vue';
import { t } from '../i18n/index.ts';
import { ApiError, api, guildPath } from '../lib/api.ts';
import { useChannels } from '../lib/channels.ts';
import { useAsk, useNotify } from '../lib/composables.ts';
import { formatDuration, formatNumber } from '../lib/format.ts';
import { useRoles } from '../lib/roles.ts';
import type { SettingCategoryValues, SettingFieldValue } from '../lib/types.ts';
import FieldControl from './FieldControl.vue';

// Settings form of one category. Each field is a row: what it is and its
// limits on the left, the input on the right (or below, for wide inputs).
// Mistakes show up while typing, and a bar appears as soon as something
// changes so nothing is left unsaved by accident.
const props = defineProps<{ guildId: string; category: SettingCategoryValues }>();
const emit = defineEmits<{
  changed: [];
  /** Current (unsaved) values, so pages can preview them (e.g. the level curve). */
  draft: [values: Record<string, unknown>];
}>();
const notify = useNotify();
const ask = useAsk();

const NUMBER_TYPES = new Set(['coins', 'percent', 'number', 'decimal']);
// Inputs that need the whole width sit under their label instead of beside it.
const WIDE_TYPES = new Set(['choice', 'template', 'channels', 'roles', 'duration', 'color']);

const needsChannels = props.category.fields.some(
  (f) => f.type === 'channel' || f.type === 'channels',
);
const needsRoles = props.category.fields.some((f) => f.type === 'roles');
const channels = needsChannels ? useChannels(props.guildId) : null;
const roles = needsRoles ? useRoles(props.guildId) : null;
const channelName = (id: string) => channels?.byId.value.get(id)?.name ?? id;

/** A stored value in the shape its input works with. */
function toInput(field: SettingFieldValue, value: unknown): unknown {
  if (NUMBER_TYPES.has(field.type)) return value === null || value === '' ? null : Number(value);
  if (field.type === 'toggle') return Boolean(value);
  if (field.type === 'channel') return (value as string | null) ?? null;
  if (field.type === 'channels' || field.type === 'roles') return [...((value as string[]) ?? [])];
  if (field.type === 'duration') return Number(value) || 0;
  return (value as string | null) ?? '';
}

const values = reactive<Record<string, unknown>>({});
const saved = ref<Record<string, string>>({});
const serverError = ref<string | null>(null);
const saving = ref(false);

function load(category: SettingCategoryValues): void {
  for (const field of category.fields) values[field.id] = toInput(field, field.value);
  saved.value = Object.fromEntries(
    category.fields.map((field) => [field.id, JSON.stringify(values[field.id])]),
  );
  serverError.value = null;
}
watch(() => props.category, load, { immediate: true });

/** The value of a field as the API expects it. */
function apiValue(field: SettingFieldValue): unknown {
  const value = values[field.id];
  if (NUMBER_TYPES.has(field.type)) return value ?? '';
  if (field.type === 'channel') return value ?? '';
  return value;
}

const draft = computed(() =>
  Object.fromEntries(props.category.fields.map((field) => [field.id, apiValue(field)])),
);
watch(draft, (current) => emit('draft', current), { immediate: true, deep: true });

const changed = computed(() =>
  props.category.fields.filter(
    (field) => JSON.stringify(values[field.id]) !== saved.value[field.id],
  ),
);
const isDefault = (field: SettingFieldValue) =>
  JSON.stringify(values[field.id]) === JSON.stringify(toInput(field, field.default));

// Fields that only matter for some values of another field stay hidden otherwise.
const SHOWN_WHEN: Record<string, (values: Record<string, unknown>) => boolean> = {
  'levelAnnounce.channel': (v) => v.mode === 'custom',
  'levelVoice.xp': (v) => v.enabled === true,
  'chatMoney.min': (v) => v.enabled === true,
  'chatMoney.max': (v) => v.enabled === true,
  'chatMoney.cooldown': (v) => v.enabled === true,
  'chatMoney.channels': (v) => v.enabled === true,
  'levelAnnounceRules.until': (v) => Number(v.every) > 1,
  'levelRank.rankTheme': (v) => v.rankStyle === 'image',
  'levelRank.accent': (v) => v.rankStyle === 'image' || v.rankStyle === 'embed',
  'levelRank.background': (v) => v.rankStyle === 'image',
  'levelRank.dim': (v) => v.rankStyle === 'image' && Boolean(v.background),
};
const visible = (field: SettingFieldValue) =>
  SHOWN_WHEN[`${props.category.id}.${field.id}`]?.(draft.value) ?? true;

type Row =
  | { kind: 'field'; field: SettingFieldValue }
  | { kind: 'range'; min: SettingFieldValue; max: SettingFieldValue };

/** Fields in order, with "min" and "max" next to each other joined into one range row. */
const rows = computed<Row[]>(() => {
  const shown = props.category.fields.filter(visible);
  const result: Row[] = [];
  for (let i = 0; i < shown.length; i++) {
    const field = shown[i]!;
    const next = shown[i + 1];
    if (field.id === 'min' && next?.id === 'max' && field.type === next.type) {
      result.push({ kind: 'range', min: field, max: next });
      i++;
    } else {
      result.push({ kind: 'field', field });
    }
  }
  return result;
});

const key = (field: SettingFieldValue, part: string) =>
  `config.fields.${props.category.id}.${field.id}.${part}`;

// Built-in text of each message template, shown when it is left empty.
const TEMPLATE_FALLBACKS: Record<string, string> = {
  'levelAnnounce.message': 'levels.announce',
};
const fallbackOf = (field: SettingFieldValue): string =>
  t(TEMPLATE_FALLBACKS[`${props.category.id}.${field.id}`] ?? 'config.builtIn');

/** A value as people read it, for the "default" hint. */
function shown(field: SettingFieldValue, value: unknown): string {
  if (value === null || value === undefined || value === '') return t('config.notSet');
  switch (field.type) {
    case 'coins':
      return `${formatNumber(Number(value))} 💠`;
    case 'percent':
      return `${value}%`;
    case 'number':
    case 'decimal':
      return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
    case 'duration':
      return formatDuration(Number(value));
    case 'toggle':
      return value ? t('config.on') : t('config.off');
    case 'choice':
      return t(`config.choices.${field.id}.${value}`).split(' — ')[0]!;
    case 'language':
      return t(`config.languages.${value}`);
    case 'channel':
      return `#${channelName(String(value))}`;
    case 'channels':
    case 'roles':
      return (value as string[]).length ? String((value as string[]).length) : t('common.none');
    case 'template':
      return t('config.builtIn');
    default:
      return String(value);
  }
}

/** Limits of a number, e.g. "Between 1 and 1,000". */
function limits(field: SettingFieldValue): string | null {
  if (!NUMBER_TYPES.has(field.type)) return null;
  const min = field.min ?? 0;
  if (field.max === null) return t('web.settings.atLeast', { min: formatNumber(min) });
  return t('web.settings.between', { min: formatNumber(min), max: formatNumber(field.max) });
}

/** What is wrong with a value right now, before saving. */
function problemOf(field: SettingFieldValue): string | null {
  const value = values[field.id];
  if (NUMBER_TYPES.has(field.type)) {
    if (value === null || value === undefined) return t('web.settings.required');
    const number = Number(value);
    const min = field.min ?? 0;
    if (number < min || (field.max !== null && number > field.max)) {
      return limits(field);
    }
  }
  if (field.type === 'duration' && !(Number(value) > 0)) return t('web.settings.durationRequired');
  if (field.type === 'url' && value && !/^https:\/\/\S+$/.test(String(value))) {
    return t('web.settings.urlHttps');
  }
  if (field.type === 'color' && !/^#[0-9a-f]{6}$/i.test(String(value))) {
    return t('web.settings.colorHex');
  }
  return null;
}

const rangeProblem = (min: SettingFieldValue, max: SettingFieldValue): string | null =>
  values[min.id] !== null &&
  values[max.id] !== null &&
  Number(values[min.id]) > Number(values[max.id])
    ? t('web.settings.minAboveMax')
    : null;

const problems = computed(() => {
  const found = rows.value.flatMap((row) =>
    row.kind === 'field'
      ? [problemOf(row.field)]
      : [problemOf(row.min), problemOf(row.max), rangeProblem(row.min, row.max)],
  );
  return found.filter(Boolean).length;
});

function resetField(field: SettingFieldValue): void {
  values[field.id] = toInput(field, field.default);
}

function discard(): void {
  load(props.category);
}

async function save(): Promise<void> {
  if (problems.value) return;
  saving.value = true;
  serverError.value = null;
  try {
    await api.put(guildPath(props.guildId, `/settings/${props.category.id}`), {
      values: draft.value,
    });
    notify.success(t('web.settings.savedToast'));
    emit('changed');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'invalid_value') {
      serverError.value = String(error.details.field);
    } else {
      notify.failure(error);
    }
  } finally {
    saving.value = false;
  }
}

async function resetAll(): Promise<void> {
  if (!(await ask(t('web.settings.resetConfirm')))) return;
  try {
    await api.post(guildPath(props.guildId, `/settings/${props.category.id}/reset`));
    notify.success(t('web.settings.restoredToast'));
    emit('changed');
  } catch (error) {
    notify.failure(error);
  }
}
</script>

<template>
  <form class="panel settings" novalidate @submit.prevent="save">
    <template v-for="row in rows" :key="row.kind === 'field' ? row.field.id : 'range'">
      <!-- One field -->
      <div
        v-if="row.kind === 'field'"
        class="setting"
        :class="{
          wide: WIDE_TYPES.has(row.field.type),
          changed: changed.includes(row.field),
          problem: problemOf(row.field) || serverError === row.field.id,
        }"
      >
        <div class="about">
          <label :for="`field-${category.id}-${row.field.id}`" class="name">
            {{ t(key(row.field, 'label')) }}
            <Tag
              v-if="!isDefault(row.field)"
              v-tooltip.top="
                t('web.settings.defaultIs', { value: shown(row.field, row.field.default) })
              "
              :value="t('web.settings.custom')"
              severity="warn"
              class="tag"
            />
          </label>
          <p class="help">{{ t(key(row.field, 'help')) }}</p>
          <p class="meta">
            <span v-if="limits(row.field)">{{ limits(row.field) }}</span>
            <span v-if="row.field.type !== 'template'">
              {{ t('web.settings.defaultIs', { value: shown(row.field, row.field.default) }) }}
            </span>
            <button
              v-if="!isDefault(row.field)"
              type="button"
              class="link"
              @click="resetField(row.field)"
            >
              <i class="pi pi-undo" /> {{ t('web.settings.useDefault') }}
            </button>
          </p>
        </div>
        <div class="control">
          <FieldControl
            v-model="values[row.field.id]"
            :field="row.field"
            :category-id="category.id"
            :input-id="`field-${category.id}-${row.field.id}`"
            :invalid="Boolean(problemOf(row.field)) || serverError === row.field.id"
            :text-channels="channels?.textChannels.value ?? []"
            :channel-name="channelName"
            :roles="roles?.roles.value ?? []"
            :fallback="fallbackOf(row.field)"
          />
          <small v-if="problemOf(row.field)" class="error">
            <i class="pi pi-exclamation-circle" /> {{ problemOf(row.field) }}
          </small>
          <small v-else-if="serverError === row.field.id" class="error">
            <i class="pi pi-exclamation-circle" />
            {{ t('web.settings.invalid', { hint: t(`config.hints.${row.field.type}`) }) }}
          </small>
        </div>
      </div>

      <!-- A minimum and a maximum, edited together -->
      <div
        v-else
        class="setting"
        :class="{
          changed: changed.includes(row.min) || changed.includes(row.max),
          problem: rangeProblem(row.min, row.max) || problemOf(row.min) || problemOf(row.max),
        }"
      >
        <div class="about">
          <span class="name">{{ t('web.settings.range') }}</span>
          <p class="help">{{ t(key(row.min, 'help')) }} {{ t(key(row.max, 'help')) }}</p>
          <p class="meta">
            <span>{{ limits(row.min) }}</span>
            <span>
              {{
                t('web.settings.defaultIs', {
                  value: `${shown(row.min, row.min.default)} – ${shown(row.max, row.max.default)}`,
                })
              }}
            </span>
            <button
              v-if="!isDefault(row.min) || !isDefault(row.max)"
              type="button"
              class="link"
              @click="(resetField(row.min), resetField(row.max))"
            >
              <i class="pi pi-undo" /> {{ t('web.settings.useDefault') }}
            </button>
          </p>
        </div>
        <div class="control">
          <div class="range">
            <label class="range-end">
              <small class="muted">{{ t(key(row.min, 'label')) }}</small>
              <FieldControl
                v-model="values[row.min.id]"
                :field="row.min"
                :category-id="category.id"
                :input-id="`field-${category.id}-min`"
                :invalid="Boolean(problemOf(row.min) || rangeProblem(row.min, row.max))"
                :text-channels="[]"
                :channel-name="channelName"
                :roles="[]"
              />
            </label>
            <span class="range-dash" aria-hidden="true">—</span>
            <label class="range-end">
              <small class="muted">{{ t(key(row.max, 'label')) }}</small>
              <FieldControl
                v-model="values[row.max.id]"
                :field="row.max"
                :category-id="category.id"
                :input-id="`field-${category.id}-max`"
                :invalid="Boolean(problemOf(row.max) || rangeProblem(row.min, row.max))"
                :text-channels="[]"
                :channel-name="channelName"
                :roles="[]"
              />
            </label>
          </div>
          <small
            v-if="rangeProblem(row.min, row.max) || problemOf(row.min) || problemOf(row.max)"
            class="error"
          >
            <i class="pi pi-exclamation-circle" />
            {{ rangeProblem(row.min, row.max) ?? problemOf(row.min) ?? problemOf(row.max) }}
          </small>
        </div>
      </div>
    </template>

    <!-- Appears while there are unsaved changes; stays in view at the bottom. -->
    <Transition name="bar">
      <div v-if="changed.length" class="save-bar" role="status">
        <span class="save-text">
          <i class="pi pi-pencil" />
          {{ t('web.settings.unsaved', { count: changed.length }) }}
          <span v-if="problems" class="error">
            · {{ t('web.settings.fixFirst', { count: problems }) }}
          </span>
        </span>
        <Button
          type="button"
          :label="t('web.settings.discard')"
          severity="secondary"
          text
          @click="discard"
        />
        <Button
          type="submit"
          :label="t('web.common.save')"
          icon="pi pi-check"
          :loading="saving"
          :disabled="problems > 0"
        />
      </div>
    </Transition>

    <div v-if="!changed.length" class="footer">
      <small class="muted"><i class="pi pi-check-circle" /> {{ t('web.settings.allSaved') }}</small>
      <Button
        type="button"
        :label="t('web.settings.reset')"
        icon="pi pi-undo"
        severity="secondary"
        size="small"
        text
        @click="resetAll"
      />
    </div>
  </form>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 1.25rem;
}

.setting {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 0.5rem 2rem;
  align-items: start;
  padding: 1.1rem 0 1.1rem 0.9rem;
  margin-left: -0.9rem;
  border-bottom: 1px solid var(--mn-border);
  border-left: 2px solid transparent;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.setting.wide {
  grid-template-columns: 1fr;
}

.setting.changed {
  border-left-color: var(--mn-amber);
}

.setting.problem {
  border-left-color: var(--p-red-400);
}

.about {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.tag {
  font-size: 0.7rem;
  cursor: help;
}

.help {
  margin: 0;
  color: var(--mn-muted);
  font-size: 0.87rem;
  line-height: 1.45;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.2rem 0.9rem;
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--mn-muted);
  font-family: var(--mn-font-mono);
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--mn-accent);
  font: inherit;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.range {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
}

.range-end {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-weight: 400;
}

.range-dash {
  padding-bottom: 0.6rem;
  color: var(--mn-muted);
}

.error {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--p-red-400);
}

.save-bar {
  position: sticky;
  bottom: 1rem;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem -0.25rem 1rem;
  padding: 0.6rem 0.6rem 0.6rem 1rem;
  border: 1px solid var(--mn-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--mn-panel-raised) 92%, transparent);
  backdrop-filter: blur(6px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.save-text {
  flex: 1;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}

.save-text .pi {
  color: var(--mn-amber);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
}

.footer .pi {
  color: #5fd068;
}

.bar-enter-active,
.bar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.bar-enter-from,
.bar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 760px) {
  .setting {
    grid-template-columns: 1fr;
  }

  .save-bar {
    flex-wrap: wrap;
  }
}
</style>
