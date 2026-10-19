<script setup lang="ts">
defineProps<{ label: string; value: string; icon: string; hint?: string }>();
</script>

<template>
  <div class="panel stat">
    <i :class="icon" class="stat-icon" />
    <div class="stat-body">
      <span class="muted label">{{ label }}</span>
      <strong class="gold value">{{ value }}</strong>
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
