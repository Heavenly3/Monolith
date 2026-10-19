<script setup lang="ts">
import { parseDuration } from '@mythcore/core/browser';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { computed, reactive, ref, watch } from 'vue';
import { t } from '../i18n/index.ts';
import { ApiError, api, guildPath } from '../lib/api.ts';
import { useAsk, useNotify } from '../lib/composables.ts';
import { formatDuration } from '../lib/format.ts';
import type { SettingCategoryValues, SettingFieldValue } from '../lib/types.ts';

const props = defineProps<{ guildId: string; category: SettingCategoryValues }>();
const emit = defineEmits<{ changed: [] }>();
const notify = useNotify();
const ask = useAsk();

// Coins and percentages are numbers; durations ("1h 30m") and the language are text.
const numbers = reactive<Record<string, number | null>>({});
const texts = reactive<Record<string, string>>({});
const isNumber = (field: SettingFieldValue): boolean =>
  field.type === 'coins' || field.type === 'percent';
const invalid = ref<string | null>(null);
const saving = ref(false);

watch(
  () => props.category,
  (category) => {
    for (const field of category.fields) {
      if (isNumber(field)) numbers[field.id] = Number(field.value);
      else if (field.type === 'duration') texts[field.id] = formatDuration(Number(field.value));
      else texts[field.id] = String(field.value);
    }
    invalid.value = null;
  },
  { immediate: true },
);

const label = (field: SettingFieldValue): string =>
  t(`config.fields.${props.category.id}.${field.id}.label`);
const help = (field: SettingFieldValue): string =>
  t(`config.fields.${props.category.id}.${field.id}.help`);

const languageOptions = computed(() => [
  { value: 'auto', label: t('config.languages.auto'), hint: t('config.languages.autoDescription') },
  { value: 'en', label: t('config.languages.en') },
  { value: 'es', label: t('config.languages.es') },
]);

function durationPreview(field: SettingFieldValue): string | null {
  const seconds = parseDuration(texts[field.id] ?? '');
  return seconds ? t('web.settings.durationPreview', { duration: formatDuration(seconds) }) : null;
}

async function save(): Promise<void> {
  saving.value = true;
  invalid.value = null;
  try {
    const payload = Object.fromEntries(
      props.category.fields.map((field) => [
        field.id,
        isNumber(field) ? String(numbers[field.id] ?? '') : (texts[field.id] ?? ''),
      ]),
    );
    await api.put(guildPath(props.guildId, `/settings/${props.category.id}`), { values: payload });
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
    <div v-for="field in category.fields" :key="field.id" class="field">
      <label :for="`field-${field.id}`" class="row">
        {{ label(field) }}
        <Tag v-if="field.custom" :value="t('web.settings.custom')" severity="warn" />
      </label>

      <InputNumber
        v-if="field.type === 'coins'"
        v-model="numbers[field.id]"
        :input-id="`field-${field.id}`"
        :min="field.min ?? 0"
        :max="Number.MAX_SAFE_INTEGER"
        :invalid="invalid === field.id"
        locale="en-US"
        suffix=" 🪙"
        fluid
      />
      <InputNumber
        v-else-if="field.type === 'percent'"
        v-model="numbers[field.id]"
        :input-id="`field-${field.id}`"
        :min="0"
        :max="1000"
        :invalid="invalid === field.id"
        suffix=" %"
        fluid
      />
      <template v-else-if="field.type === 'duration'">
        <InputText
          :id="`field-${field.id}`"
          v-model="texts[field.id]"
          :invalid="invalid === field.id || !durationPreview(field)"
          :placeholder="t('config.hints.duration')"
          fluid
        />
        <small class="gold">{{ durationPreview(field) ?? t('config.hints.duration') }}</small>
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

      <small v-if="invalid === field.id" class="error">
        {{ t('web.settings.invalid', { hint: t(`config.hints.${field.type}`) }) }}
      </small>
      <small v-else>{{ help(field) }}</small>
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
</style>
