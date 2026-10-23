<script setup lang="ts">
import { parseDuration } from '@monolith/core/browser';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, reactive, ref, watch } from 'vue';
import { t } from '../i18n/index.ts';
import { ApiError, api, guildPath } from '../lib/api.ts';
import { useChannels } from '../lib/channels.ts';
import { useAsk, useNotify } from '../lib/composables.ts';
import { formatDuration } from '../lib/format.ts';
import { useRoles } from '../lib/roles.ts';
import type { SettingCategoryValues, SettingFieldValue } from '../lib/types.ts';
import ChoiceCards from './ChoiceCards.vue';
import RoleTag from './RoleTag.vue';
import TemplateEditor from './TemplateEditor.vue';

const props = defineProps<{ guildId: string; category: SettingCategoryValues }>();
const emit = defineEmits<{
  changed: [];
  /** Current (unsaved) values, so pages can preview them (e.g. the level curve). */
  draft: [values: Record<string, unknown>];
}>();
const notify = useNotify();
const ask = useAsk();

// Each kind of input keeps its values in a map of the right type.
const numbers = reactive<Record<string, number | null>>({});
const texts = reactive<Record<string, string>>({});
const flags = reactive<Record<string, boolean>>({});
const singles = reactive<Record<string, string | null>>({});
const lists = reactive<Record<string, string[]>>({});

const NUMBER_TYPES = new Set(['coins', 'percent', 'number', 'decimal']);
const LIST_TYPES = new Set(['channels', 'roles']);
const needsChannels = computed(() =>
  props.category.fields.some((f) => f.type === 'channel' || f.type === 'channels'),
);
const needsRoles = computed(() => props.category.fields.some((f) => f.type === 'roles'));
const channels = needsChannels.value ? useChannels(props.guildId) : null;
const roles = needsRoles.value ? useRoles(props.guildId) : null;

const invalid = ref<string | null>(null);
const saving = ref(false);

function load(category: SettingCategoryValues): void {
  for (const field of category.fields) {
    const value = field.value;
    if (NUMBER_TYPES.has(field.type)) numbers[field.id] = Number(value);
    else if (field.type === 'toggle') flags[field.id] = Boolean(value);
    else if (field.type === 'channel') singles[field.id] = (value as string | null) ?? null;
    else if (LIST_TYPES.has(field.type)) lists[field.id] = [...((value as string[]) ?? [])];
    else if (field.type === 'duration') texts[field.id] = formatDuration(Number(value));
    else texts[field.id] = (value as string | null) ?? '';
  }
  invalid.value = null;
}
watch(() => props.category, load, { immediate: true });

/** The value of a field as the API expects it. */
function valueOf(field: SettingFieldValue): unknown {
  if (NUMBER_TYPES.has(field.type)) return numbers[field.id] ?? '';
  if (field.type === 'toggle') return flags[field.id] ?? false;
  if (field.type === 'channel') return singles[field.id] ?? '';
  if (LIST_TYPES.has(field.type)) return lists[field.id] ?? [];
  return texts[field.id] ?? '';
}

const draft = computed(() =>
  Object.fromEntries(props.category.fields.map((field) => [field.id, valueOf(field)])),
);
watch(draft, (values) => emit('draft', values), { immediate: true, deep: true });

// Fields that only matter for some values of another field stay hidden otherwise.
const SHOWN_WHEN: Record<string, (values: Record<string, unknown>) => boolean> = {
  'levelAnnounce.channel': (values) => values.mode === 'custom',
  'levelVoice.xp': (values) => values.enabled === true,
  'levelAnnounceRules.until': (values) => Number(values.every) > 1,
};
const visibleFields = computed(() =>
  props.category.fields.filter(
    (field) => SHOWN_WHEN[`${props.category.id}.${field.id}`]?.(draft.value) ?? true,
  ),
);

const key = (field: SettingFieldValue, part: string) =>
  `config.fields.${props.category.id}.${field.id}.${part}`;

const languageOptions = computed(() => [
  { value: 'auto', label: t('config.languages.auto'), hint: t('config.languages.autoDescription') },
  { value: 'en', label: t('config.languages.en') },
  { value: 'es', label: t('config.languages.es') },
]);

const choiceOptions = (field: SettingFieldValue) =>
  (field.options ?? []).map((value) => ({
    value,
    text: t(`config.choices.${field.id}.${value}`),
  }));

// Built-in text of each message template, shown when it is left empty.
const TEMPLATE_FALLBACKS: Record<string, string> = {
  'levelAnnounce.message': 'levels.announce',
};
const fallbackOf = (field: SettingFieldValue): string =>
  t(TEMPLATE_FALLBACKS[`${props.category.id}.${field.id}`] ?? 'config.builtIn');

function durationPreview(field: SettingFieldValue): string | null {
  const seconds = parseDuration(texts[field.id] ?? '');
  return seconds ? t('web.settings.durationPreview', { duration: formatDuration(seconds) }) : null;
}

async function save(): Promise<void> {
  saving.value = true;
  invalid.value = null;
  try {
    await api.put(guildPath(props.guildId, `/settings/${props.category.id}`), {
      values: draft.value,
    });
    notify.success(t('web.settings.savedToast'));
    emit('changed');
  } catch (error) {
    if (error instanceof ApiError && error.code === 'invalid_value') {
      invalid.value = String(error.details.field);
    } else {
      notify.failure(error);
    }
  } finally {
    saving.value = false;
  }
}

async function reset(): Promise<void> {
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
  <form class="panel stack" @submit.prevent="save">
    <div
      v-for="field in visibleFields"
      :key="field.id"
      class="field"
      :class="{ 'field-toggle': field.type === 'toggle' }"
    >
      <!-- On/off switches read best as one row: text on the left, switch on the right. -->
      <template v-if="field.type === 'toggle'">
        <label :for="`field-${field.id}`" class="toggle-text">
          <span class="row">
            {{ t(key(field, 'label')) }}
            <Tag v-if="field.custom" :value="t('web.settings.custom')" severity="warn" />
          </span>
          <small>{{ t(key(field, 'help')) }}</small>
        </label>
        <ToggleSwitch v-model="flags[field.id]" :input-id="`field-${field.id}`" />
      </template>

      <template v-else>
        <label :for="`field-${field.id}`" class="row">
          {{ t(key(field, 'label')) }}
          <Tag v-if="field.custom" :value="t('web.settings.custom')" severity="warn" />
        </label>

        <InputNumber
          v-if="NUMBER_TYPES.has(field.type)"
          v-model="numbers[field.id]"
          :input-id="`field-${field.id}`"
          :min="field.min ?? 0"
          :max="field.max ?? (field.type === 'percent' ? 1000 : Number.MAX_SAFE_INTEGER)"
          :invalid="invalid === field.id"
          :suffix="field.type === 'coins' ? ' 💠' : field.type === 'percent' ? ' %' : undefined"
          :max-fraction-digits="field.type === 'decimal' ? 2 : 0"
          :step="field.type === 'decimal' && (numbers[field.id] ?? 0) < 10 ? 0.1 : 1"
          locale="en-US"
          show-buttons
          button-layout="horizontal"
          fluid
        >
          <template #incrementbuttonicon><span class="pi pi-plus" /></template>
          <template #decrementbuttonicon><span class="pi pi-minus" /></template>
        </InputNumber>

        <template v-else-if="field.type === 'duration'">
          <InputText
            :id="`field-${field.id}`"
            v-model="texts[field.id]"
            :invalid="invalid === field.id || !durationPreview(field)"
            :placeholder="t('config.hints.duration')"
            fluid
          />
          <small class="amount">{{ durationPreview(field) ?? t('config.hints.duration') }}</small>
        </template>

        <Select
          v-else-if="field.type === 'language'"
          v-model="texts[field.id]"
          :input-id="`field-${field.id}`"
          :options="languageOptions"
          option-label="label"
          option-value="value"
          fluid
        >
          <template #option="{ option }">
            <div class="stack-tight">
              <span>{{ option.label }}</span>
              <small v-if="option.hint" class="muted">{{ option.hint }}</small>
            </div>
          </template>
        </Select>

        <ChoiceCards
          v-else-if="field.type === 'choice'"
          v-model="texts[field.id]!"
          :options="choiceOptions(field)"
          :invalid="invalid === field.id"
        />

        <Select
          v-else-if="field.type === 'channel'"
          v-model="singles[field.id]"
          :input-id="`field-${field.id}`"
          :options="channels?.textChannels.value ?? []"
          option-label="name"
          option-value="id"
          :placeholder="t('config.notSet')"
          :invalid="invalid === field.id"
          :loading="channels?.loading.value"
          show-clear
          filter
          fluid
        >
          <template #option="{ option }"># {{ option.name }}</template>
          <template #value="{ value, placeholder }">
            <span v-if="value"># {{ channels?.byId.value.get(value)?.name ?? value }}</span>
            <span v-else class="muted">{{ placeholder }}</span>
          </template>
        </Select>

        <MultiSelect
          v-else-if="field.type === 'channels'"
          v-model="lists[field.id]"
          :input-id="`field-${field.id}`"
          :options="channels?.textChannels.value ?? []"
          option-label="name"
          option-value="id"
          :placeholder="t('common.none')"
          :selection-limit="field.limit ?? 25"
          :invalid="invalid === field.id"
          display="chip"
          filter
          fluid
        >
          <template #option="{ option }"># {{ option.name }}</template>
        </MultiSelect>

        <MultiSelect
          v-else-if="field.type === 'roles'"
          v-model="lists[field.id]"
          :input-id="`field-${field.id}`"
          :options="roles?.roles.value ?? []"
          option-label="name"
          option-value="id"
          :placeholder="t('common.none')"
          :selection-limit="field.limit ?? 25"
          :invalid="invalid === field.id"
          display="chip"
          filter
          fluid
        >
          <template #option="{ option }"><RoleTag :role="option" /></template>
        </MultiSelect>

        <TemplateEditor
          v-else-if="field.type === 'template'"
          v-model="texts[field.id]!"
          :input-id="`field-${field.id}`"
          :variables="field.variables ?? []"
          :fallback="fallbackOf(field)"
          :limit="field.limit ?? 500"
          :invalid="invalid === field.id"
        />

        <small v-if="invalid === field.id" class="error">
          {{ t('web.settings.invalid', { hint: t(`config.hints.${field.type}`) }) }}
        </small>
        <small v-else>{{ t(key(field, 'help')) }}</small>
      </template>
    </div>

    <div class="row actions">
      <Button type="submit" :label="t('web.common.save')" icon="pi pi-check" :loading="saving" />
      <Button
        type="button"
        :label="t('web.settings.reset')"
        icon="pi pi-undo"
        severity="secondary"
        outlined
        @click="reset"
      />
    </div>
  </form>
</template>

<style scoped>
.actions {
  justify-content: flex-end;
}

.error {
  color: var(--p-red-400);
}

.stack-tight {
  display: flex;
  flex-direction: column;
}

.field-toggle {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: var(--mn-panel-raised);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  cursor: pointer;
}

.toggle-text small {
  font-weight: 400;
}
</style>
