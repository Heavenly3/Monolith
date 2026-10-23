<script setup lang="ts">
import { roleColor } from '../lib/format.ts';
import type { Role } from '../lib/types.ts';

defineProps<{ role: Role | undefined; fallback?: string }>();
</script>

<template>
  <span class="role">
    <span class="dot" :style="{ background: role ? roleColor(role.color) : undefined }" />
    {{ role ? role.name : fallback }}
  </span>
</template>

<style scoped>
.role {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: var(--mn-muted);
  flex-shrink: 0;
}
</style>
