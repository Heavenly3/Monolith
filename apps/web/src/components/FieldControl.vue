<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Select from 'primevue/select';
import Slider from 'primevue/slider';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';
import type { Channel, Role, SettingFieldValue } from '../lib/types.ts';
import ChoiceCards from './ChoiceCards.vue';
import ColorInput from './ColorInput.vue';
import DurationInput from './DurationInput.vue';
import RoleTag from './RoleTag.vue';
import TemplateEditor from './TemplateEditor.vue';

// The input that edits one settings field, picked by its type. The model is
// the field's value in the shape the input works with (see SettingsForm).
const props = defineProps<{
  field: SettingFieldValue;
  categoryId: string;
  inputId: string;
  invalid?: boolean;
  textChannels: Channel[];
  channelName: (id: string) => string;
  roles: Role[];
  /** Built-in text a template falls back to when left empty. */
  fallback?: string;
}>();
const model = defineModel<unknown>({ required: true });

const NUMBER_TYPES = new Set(['coins', 'percent', 'number', 'decimal']);
const isNumber = computed(() => NUMBER_TYPES.has(props.field.type));
// Percentages up to 100 get a slider next to the number.
const slider = computed(() => props.field.type === 'percent' && (props.field.max ?? 1000) <= 100);

const numberModel = computed({
  get: () => (model.value as number | null) ?? null,
  set: (value: number | null) => (model.value = value),
});
const sliderModel = computed({
  get: () => Number(model.value ?? 0),
  set: (value: number | number[]) => (model.value = Array.isArray(value) ? value[0] : value),
});
const text = computed({
  get: () => String(model.value ?? ''),
  set: (value: string) => (model.value = value),
});
const single = computed({
  get: () => (model.value as string | null) ?? null,
  set: (value: string | null) => (model.value = value),
});
const list = computed({
  get: () => (model.value as string[]) ?? [],
  set: (value: string[]) => (model.value = value),
});
const flag = computed({
  get: () => Boolean(model.value),
  set: (value: boolean) => (model.value = value),
});
const seconds = computed({
  get: () => Number(model.value ?? 0),
  set: (value: number) => (model.value = value),
});

const UNITS: Record<string, string> = { coins: ' 💠', percent: ' %' };

const languageOptions = computed(() => [
  { value: 'auto', label: t('config.languages.auto'), hint: t('config.languages.autoDescription') },
  { value: 'en', label: t('config.languages.en') },
  { value: 'es', label: t('config.languages.es') },
]);

const choiceOptions = computed(() =>
  (props.field.options ?? []).map((value) => ({
    value,
    text: t(`config.choices.${props.field.id}.${value}`),
  })),
);
</script>

<template>
  <div v-if="isNumber" class="number" :class="{ 'with-slider': slider }">
    <Slider
      v-if="slider"
      v-model="sliderModel"
      :min="field.min ?? 0"
      :max="field.max ?? 100"
      :aria-label="inputId"
      class="slider"
    />
    <InputNumber
      v-model="numberModel"
      :input-id="inputId"
      :min="field.min ?? 0"
      :max="field.max ?? (field.type === 'percent' ? 1000 : Number.MAX_SAFE_INTEGER)"
      :invalid="invalid"
      :suffix="UNITS[field.type]"
      :max-fraction-digits="field.type === 'decimal' ? 2 : 0"
      :step="field.type === 'decimal' && (numberModel ?? 0) < 10 ? 0.1 : 1"
      :placeholder="field.min !== null ? String(field.min) : '0'"
      locale="en-US"
      show-buttons
      button-layout="stacked"
      class="number-input"
    />
  </div>

  <DurationInput
    v-else-if="field.type === 'duration'"
    v-model="seconds"
    :input-id="inputId"
    :invalid="invalid"
  />

  <ToggleSwitch v-else-if="field.type === 'toggle'" v-model="flag" :input-id="inputId" />

  <ColorInput
    v-else-if="field.type === 'color'"
    v-model="text"
    :input-id="inputId"
    :invalid="invalid"
  />

  <InputText
    v-else-if="field.type === 'url'"
    :id="inputId"
    v-model="text"
    :invalid="invalid"
    placeholder="https://…"
    type="url"
    fluid
  />

  <Select
    v-else-if="field.type === 'language'"
    v-model="text"
    :input-id="inputId"
    :options="languageOptions"
    option-label="label"
    option-value="value"
    fluid
  >
    <template #option="{ option }">
      <div class="option">
        <span>{{ option.label }}</span>
        <small v-if="option.hint" class="muted">{{ option.hint }}</small>
      </div>
    </template>
  </Select>

  <ChoiceCards
    v-else-if="field.type === 'choice'"
    v-model="text"
    :options="choiceOptions"
    :invalid="invalid"
  />

  <Select
    v-else-if="field.type === 'channel'"
    v-model="single"
    :input-id="inputId"
    :options="textChannels"
    option-label="name"
    option-value="id"
    :placeholder="t('config.notSet')"
    :invalid="invalid"
    show-clear
    filter
    fluid
  >
    <template #option="{ option }"># {{ option.name }}</template>
    <template #value="{ value, placeholder }">
      <span v-if="value"># {{ channelName(value) }}</span>
      <span v-else class="muted">{{ placeholder }}</span>
    </template>
  </Select>

  <MultiSelect
    v-else-if="field.type === 'channels'"
    v-model="list"
    :input-id="inputId"
    :options="textChannels"
    option-label="name"
    option-value="id"
    :placeholder="t('web.settings.pickChannels')"
    :selection-limit="field.limit ?? 25"
    :invalid="invalid"
    display="chip"
    filter
    fluid
  >
    <template #option="{ option }"># {{ option.name }}</template>
  </MultiSelect>

  <MultiSelect
    v-else-if="field.type === 'roles'"
    v-model="list"
    :input-id="inputId"
    :options="roles"
    option-label="name"
    option-value="id"
    :placeholder="t('web.settings.pickRoles')"
    :selection-limit="field.limit ?? 25"
    :invalid="invalid"
    display="chip"
    filter
    fluid
  >
    <template #option="{ option }"><RoleTag :role="option" /></template>
  </MultiSelect>

  <TemplateEditor
    v-else-if="field.type === 'template'"
    v-model="text"
    :input-id="inputId"
    :variables="field.variables ?? []"
    :fallback="fallback ?? t('config.builtIn')"
    :limit="field.limit ?? 500"
    :invalid="invalid"
  />
</template>

<style scoped>
.number {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.number-input {
  display: inline-flex;
  flex: 0 0 auto;
  width: 11rem;
  max-width: 100%;
}

/* PrimeVue's inner input keeps a default width; make it follow the box. */
.number-input :deep(input) {
  width: 100%;
  min-width: 0;
  font-family: var(--mn-font-mono);
}

.with-slider .slider {
  flex: 1;
  min-width: 6rem;
}

.option {
  display: flex;
  flex-direction: column;
}
</style>
