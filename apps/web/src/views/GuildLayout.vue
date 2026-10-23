<script setup lang="ts">
import BrandLogo from '../components/BrandLogo.vue';
import Button from 'primevue/button';
import Drawer from 'primevue/drawer';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import GuildNav, { type NavSection } from '../components/GuildNav.vue';
import UserMenu from '../components/UserMenu.vue';
import { t } from '../i18n/index.ts';
import { api } from '../lib/api.ts';
import { errorMessage } from '../lib/errors.ts';
import { GUILD } from '../lib/guild.ts';
import { SECTIONS, SECTION_IDS } from '../lib/sections.ts';
import type { GuildSummary } from '../lib/types.ts';

const props = defineProps<{ guildId: string }>();
const route = useRoute();

const guild = ref<GuildSummary | null>(null);
const error = ref<string | null>(null);
const drawer = ref(false);

// Pages read the server through useGuild(); they only render once it is loaded.
provide(GUILD, guild as never);

watch(
  () => props.guildId,
  async (guildId) => {
    guild.value = null;
    error.value = null;
    try {
      const { guilds } = await api.get<{ guilds: GuildSummary[] }>('/api/guilds');
      const found = guilds.find((candidate) => candidate.id === guildId && candidate.hasBot);
      if (found) guild.value = found;
      else error.value = t('web.guilds.noBot');
    } catch (failure) {
      error.value = errorMessage(failure);
    }
  },
  { immediate: true },
);

// Close the mobile menu after navigating.
watch(
  () => route.fullPath,
  () => (drawer.value = false),
);

const sections = computed<NavSection[]>(() => [
  {
    title: null,
    links: [
      { to: { name: 'overview' }, icon: 'pi pi-home', label: t('web.nav.overview'), exact: true },
      ...SECTION_IDS.map((section) => ({
        to: `/g/${props.guildId}/${section}`,
        icon: SECTIONS[section].icon,
        label: t(`web.sections.${section}.title`),
      })),
    ],
  },
  {
    title: t('web.nav.admin'),
    links: [{ to: { name: 'history' }, icon: 'pi pi-history', label: t('web.nav.history') }],
  },
]);
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <GuildNav :sections="sections" :guild="guild" />
    </aside>

    <Drawer v-model:visible="drawer" :header="guild?.name ?? 'Monolith'">
      <GuildNav :sections="sections" :guild="null" />
    </Drawer>

    <div class="main">
      <header class="topbar">
        <Button
          class="menu-button"
          icon="pi pi-bars"
          text
          rounded
          severity="secondary"
          aria-label="Menu"
          @click="drawer = true"
        />
        <BrandLogo class="brand" />
        <UserMenu />
      </header>
      <main class="content">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div v-else-if="!guild" class="loading"><ProgressSpinner /></div>
        <RouterView v-else :key="guildId" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  /* Paints the sidebar column down to the end of long pages. */
  background: linear-gradient(
    90deg,
    var(--mn-panel) var(--mn-sidebar),
    var(--mn-border) var(--mn-sidebar) calc(var(--mn-sidebar) + 1px),
    transparent 0
  );
}

.sidebar {
  width: var(--mn-sidebar);
  flex-shrink: 0;
  background: var(--mn-panel);
  border-right: 1px solid var(--mn-border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 1rem 0.75rem;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--mn-border);
}

.brand,
.menu-button {
  display: none;
}

.content {
  padding: 1.75rem 1.5rem 3rem;
}

.loading {
  display: grid;
  place-items: center;
  padding: 4rem 0;
}

@media (max-width: 900px) {
  .layout {
    background: none;
  }

  .sidebar {
    display: none;
  }

  .topbar {
    justify-content: space-between;
    padding: 0.5rem 1rem;
  }

  .brand,
  .menu-button {
    display: inline-flex;
  }

  .brand {
    font-family: var(--mn-font-display);
    color: var(--mn-accent-soft);
    font-weight: 700;
    margin-right: auto;
  }

  .content {
    padding: 1.25rem 1rem 2.5rem;
  }
}
</style>
