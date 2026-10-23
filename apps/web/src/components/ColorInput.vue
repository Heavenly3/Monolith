<script setup lang="ts">
import { RANK_ACCENT_PRESETS } from '@monolith/core/browser';
import ColorPicker from 'primevue/colorpicker';
import InputText from 'primevue/inputtext';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';

// A #rrggbb colour: a picker, the hex code and a row of quick picks.
defineProps<{ inputId?: string; invalid?: boolean }>();
const model = defineModel<string>({ required: true });

// The PrimeVue picker works with hex without "#".
const picker = computed({
  get: () => model.value.replace('#', ''),
  set: (value: string) => (model.value = `#${value}`.toLowerCase()),
});
</script>

<template>
  <div class="color">
    <div class="row">
      <ColorPicker v-model="picker" format="hex" :aria-label="t('web.rankCard.pickColor')" />
      <InputText :id="inputId" v-model="model" :invalid="invalid" maxlength="7" class="hex" />
    </div>
    <div class="row swatches">
      <small class="muted">{{ t('web.rankCard.presets') }}</small>
      <button
        v-for="preset in RANK_ACCENT_PRESETS"
        :key="preset"
        type="button"
        class="swatch"
        :class="{ active: model.toLowerCase() === preset }"
        :style="{ background: preset }"
        :aria-label="preset"
        @click="model = preset"
      />
    </div>
  </div>
</template>

<style scoped>
.color {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hex {
  width: 8rem;
  font-family: var(--mn-font-mono);
}

.swatches {
  gap: 0.4rem;
  flex-wrap: wrap;
}

.swatch {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 6px;
  border: 2px solid var(--mn-border);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.swatch:hover {
  transform: translateY(-1px);
}

.swatch.active {
  border-color: #fff;
}
</style>
