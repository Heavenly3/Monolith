<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { t } from '../i18n/index.ts';
import type { GuildSummary } from '../lib/types.ts';
import GuildAvatar from './GuildAvatar.vue';

export interface NavSection {
  title: string | null;
  links: { to: RouteLocationRaw; icon: string; label: string }[];
}

defineProps<{ sections: NavSection[]; guild: GuildSummary | null }>();
</script>

<template>
  <nav class="nav">
    <RouterLink :to="{ name: 'guilds' }" class="back">
      <i class="pi pi-arrow-left" /> {{ t('web.nav.servers') }}
    </RouterLink>
    <div v-if="guild" class="guild-head">
      <GuildAvatar :guild="guild" size="normal" />
      <strong>{{ guild.name }}</strong>
    </div>
    <div v-for="(section, index) in sections" :key="index" class="nav-section">
      <span v-if="section.title" class="nav-title">{{ section.title }}</span>
      <RouterLink
        v-for="link in section.links"
        :key="link.label"
        :to="link.to"
        class="nav-link"
        exact-active-class="active"
      >
        <i :class="link.icon" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back {
  color: var(--mc-muted);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 0 0.5rem;
}

.back:hover {
  color: var(--mc-text);
}

.guild-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.5rem;
}

.guild-head strong {
  font-family: var(--mc-font-display);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-title {
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--mc-muted);
  padding: 0.25rem 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  color: var(--mc-text);
  text-decoration: none;
  font-size: 0.92rem;
}

.nav-link i {
  color: var(--mc-muted);
  width: 1rem;
}

.nav-link:hover {
  background: var(--mc-panel-raised);
}

.nav-link.active {
  background: rgba(201, 162, 39, 0.14);
  color: var(--mc-gold-soft);
}

.nav-link.active i {
  color: var(--mc-gold);
}
</style>
