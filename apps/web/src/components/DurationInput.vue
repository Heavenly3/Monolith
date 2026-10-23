<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';
import { formatDuration } from '../lib/format.ts';

// A duration typed as days, hours, minutes and seconds instead of "1h30m".
// The model is the total in seconds.
const props = defineProps<{ inputId?: string; invalid?: boolean; max?: number }>();
const seconds = defineModel<number>({ required: true });

const UNITS = [
  { id: 'days', size: 86_400, max: 365 },
  { id: 'hours', size: 3_600, max: 23 },
  { id: 'minutes', size: 60, max: 59 },
  { id: 'seconds', size: 1, max: 59 },
] as const;

const QUICK = [30, 300, 3_600, 86_400, 604_800];

const parts = computed(() => {
  let rest = Math.max(0, Math.floor(seconds.value || 0));
  return Object.fromEntries(
    UNITS.map((unit) => {
      const amount = Math.floor(rest / unit.size);
      rest -= amount * unit.size;
      return [unit.id, amount];
    }),
  ) as Record<(typeof UNITS)[number]['id'], number>;
});

function set(unit: (typeof UNITS)[number]['id'], value: number | null): void {
  const next = { ...parts.value, [unit]: Math.max(0, value ?? 0) };
  const total = UNITS.reduce((sum, u) => sum + next[u.id] * u.size, 0);
  seconds.value = Math.min(props.max ?? 365 * 86_400, total);
}
</script>

<template>
  <div class="duration" :class="{ invalid }">
    <div class="units">
      <label v-for="(unit, index) in UNITS" :key="unit.id" class="unit">
        <InputNumber
          :model-value="parts[unit.id]"
          :input-id="index === 0 ? inputId : undefined"
          :min="0"
          :max="unit.max"
          :invalid="invalid"
          :aria-label="t(`web.duration.${unit.id}`)"
          fluid
          @update:model-value="set(unit.id, $event)"
        />
        <span class="muted">{{ t(`web.duration.${unit.id}`) }}</span>
      </label>
    </div>
    <div class="row quick">
      <small class="muted">{{ t('web.duration.quick') }}</small>
      <Button
        v-for="value in QUICK"
        :key="value"
        :label="formatDuration(value)"
        size="small"
        severity="secondary"
        :outlined="seconds !== value"
        rounded
        type="button"
        @click="seconds = value"
      />
    </div>
    <small class="amount">= {{ seconds > 0 ? formatDuration(seconds) : '0s' }}</small>
  </div>
</template>

<style scoped>
.duration {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.units {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.unit {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 400;
}

.unit span {
  font-size: 0.8rem;
  min-width: 2.2rem;
}

.quick {
  flex-wrap: wrap;
  gap: 0.35rem;
}

@media (max-width: 520px) {
  .units {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
