<script setup lang="ts">
// The Monolith mark (the same slab as the bot's logo emoji) and, optionally, the name.
withDefaults(defineProps<{ size?: number; name?: boolean }>(), { size: 22, name: true });
</script>

<template>
  <span class="brand">
    <svg :width="size * 0.7" :height="size" viewBox="0 0 17 24" aria-hidden="true">
      <rect x="2" y="1" width="10" height="22" fill="currentColor" />
      <path d="M12 1l3 2.2v17.6l-3 2.2z" fill="currentColor" opacity="0.55" />
    </svg>
    <span v-if="name" class="brand-name">Monolith</span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--mn-accent);
}

.brand-name {
  font-family: var(--mn-font-display);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--mn-text);
}
</style>
