<script setup lang="ts">
import { computed } from 'vue';
import { compactNumber, formatNumber } from '../lib/format.ts';

const props = defineProps<{ label: string; value: number; icon: string; hint?: string }>();

// Large amounts are shortened to fit the card; the exact one shows on hover.
const shown = computed(() => compactNumber(props.value));
const exact = computed(() => formatNumber(props.value));
</script>

<template>
  <div class="panel stat">
    <i :class="icon" class="stat-icon" />
    <div class="stat-body">
      <span class="muted label">{{ label }}</span>
      <strong v-tooltip.top="shown !== exact ? exact : undefined" class="gold value">{{
        shown
      }}</strong>
      <small v-if="hint" class="muted">{{ hint }}</small>
    </div>
  </div>
</template>

<style scoped>
.stat {
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
}

.stat-icon {
  font-size: 1.1rem;
  color: var(--mc-gold);
  background: rgba(201, 162, 39, 0.12);
  border-radius: 10px;
  padding: 0.65rem;
}

.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.label {
  font-size: 0.85rem;
}

.value {
  font-size: 1.35rem;
  font-weight: 700;
  white-space: nowrap;
}

/* Phones: icon above the text so large amounts keep one line. */
@media (max-width: 480px) {
  .stat {
    flex-direction: column;
    gap: 0.5rem;
  }

  .value {
    font-size: 1.05rem;
  }
}
</style>
