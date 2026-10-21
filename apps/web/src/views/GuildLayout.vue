<script setup lang="ts">
import { SETTING_CATEGORIES, type CategoryGroup } from '@mythcore/core/browser';
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

const SETTINGS_ICONS: Record<string, string> = {
  general: 'pi pi-globe',
  modules: 'pi pi-th-large',
  work: 'pi pi-briefcase',
  collect: 'pi pi-users',
  wheel: 'pi pi-sync',
  games: 'pi pi-star',
  loans: 'pi pi-credit-card',
  raffle: 'pi pi-ticket',
  levels: 'pi pi-bolt',
  levelCurve: 'pi pi-chart-line',
  levelVoice: 'pi pi-microphone',
  levelAnnounce: 'pi pi-megaphone',
  levelFilters: 'pi pi-filter',
};

const settingsLinks = (group: CategoryGroup) =>
  Object.entries(SETTING_CATEGORIES)
    .filter(([, category]) => category.group === group)
    .map(([category]) => ({
      to: { name: 'settings', params: { category } },
      icon: SETTINGS_ICONS[category] ?? 'pi pi-cog',
      label: t(`config.categories.${category}.label`),
    }));

const sections = computed<NavSection[]>(() => [
  {
    title: null,
    links: [
      { to: { name: 'overview' }, icon: 'pi pi-home', label: t('web.nav.overview') },
      ...settingsLinks('general'),
    ],
  },
  {
    title: t('web.nav.economy'),
    links: [
      { to: { name: 'members' }, icon: 'pi pi-wallet', label: t('web.nav.members') },
      { to: { name: 'shop' }, icon: 'pi pi-shopping-bag', label: t('web.nav.shop') },
      { to: { name: 'loans' }, icon: 'pi pi-file-edit', label: t('web.nav.loans') },
      ...settingsLinks('economy'),
    ],
  },
  {
    title: t('web.nav.levels'),
    links: [
      {
        to: { name: 'level-members' },
        icon: 'pi pi-sort-amount-down',
        label: t('config.categories.levelMembers.label'),
      },
      {
        to: { name: 'level-rewards' },
        icon: 'pi pi-gift',
        label: t('config.categories.levelRewards.label'),
      },
      ...settingsLinks('levels'),
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

    <Drawer v-model:visible="drawer" :header="guild?.name ?? 'Mythcore'">
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
        <span class="brand">⚜️ Mythcore</span>
        <UserMenu />
      </header>
      <main class="content">
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <div v-else-if="!guild" class="loading"><ProgressSpinner /></div>
        <RouterView v-else :key="route.fullPath" />
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
    var(--mc-panel) var(--mc-sidebar),
    var(--mc-border) var(--mc-sidebar) calc(var(--mc-sidebar) + 1px),
    transparent 0
  );
}

.sidebar {
  width: var(--mc-sidebar);
  flex-shrink: 0;
  background: var(--mc-panel);
  border-right: 1px solid var(--mc-border);
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
  border-bottom: 1px solid var(--mc-border);
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
    font-family: var(--mc-font-display);
    color: var(--mc-gold-soft);
    font-weight: 700;
    margin-right: auto;
  }

  .content {
    padding: 1.25rem 1rem 2.5rem;
  }
}
</style>
