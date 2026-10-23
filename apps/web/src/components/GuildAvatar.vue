<script setup lang="ts">
import Avatar from 'primevue/avatar';
import { computed } from 'vue';
import { guildIcon, initials } from '../lib/format.ts';

const props = withDefaults(
  defineProps<{
    guild: { id: string; name: string; icon: string | null };
    size?: 'normal' | 'large' | 'xlarge';
  }>(),
  { size: 'large' },
);
const image = computed(() => guildIcon(props.guild) ?? undefined);
</script>

<template>
  <Avatar
    :image="image"
    :label="image ? undefined : initials(guild.name)"
    :size="size"
    shape="square"
    class="guild-avatar"
  />
</template>

<style scoped>
.guild-avatar {
  border-radius: 10px;
  overflow: hidden;
  background: var(--mn-panel-raised);
  color: var(--mn-accent-soft);
  font-family: var(--mn-font-display);
  flex-shrink: 0;
}
</style>
