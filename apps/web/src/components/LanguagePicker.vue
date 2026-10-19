<script setup lang="ts">
import type { Language } from '@mythcore/i18n';
import SelectButton from 'primevue/selectbutton';
import { computed } from 'vue';
import { lang, languages, setLanguage, t } from '../i18n/index.ts';

const options = languages.map((value) => ({
  value,
  label: value.toUpperCase(),
}));

const current = computed({
  get: () => lang.value,
  set: (value: Language | null) => value && setLanguage(value),
});
</script>

<template>
  <SelectButton
    v-model="current"
    :options="options"
    option-label="label"
    option-value="value"
    :allow-empty="false"
    :aria-label="t('web.nav.language')"
    size="small"
  />
</template>
