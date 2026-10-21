<script setup lang="ts">
import { inject } from 'vue';
import { IN_SECTION } from '../lib/guild.ts';

defineProps<{ title: string; subtitle?: string }>();
// Inside a section (economy, levels...) the section already has the main title.
const inSection = inject(IN_SECTION, false);
</script>

<template>
  <div class="page-header">
    <div>
      <component :is="inSection ? 'h2' : 'h1'">{{ title }}</component>
      <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    </div>
    <div class="row">
      <slot />
    </div>
  </div>
</template>
