<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import { onMounted, ref } from 'vue';
import GuildAvatar from '../components/GuildAvatar.vue';
import UserMenu from '../components/UserMenu.vue';
import { t } from '../i18n/index.ts';
import { api } from '../lib/api.ts';
import { errorMessage } from '../lib/errors.ts';
import type { GuildSummary } from '../lib/types.ts';

const guilds = ref<GuildSummary[] | null>(null);
const inviteUrl = ref('');
const error = ref<string | null>(null);
const loading = ref(false);

async function load(fresh = false): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const result = await api.get<{ guilds: GuildSummary[]; inviteUrl: string }>(
      `/api/guilds${fresh ? '?fresh=1' : ''}`,
    );
    guilds.value = result.guilds;
    inviteUrl.value = result.inviteUrl;
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    loading.value = false;
  }
}

const invite = (guildId: string): string =>
  `${inviteUrl.value}&guild_id=${guildId}&disable_guild_select=true`;

onMounted(() => load());
</script>

<template>
  <div class="guilds-page">
    <header class="topbar">
      <span class="brand">⚜️ Monolith</span>
      <UserMenu />
    </header>

    <main class="page">
      <div class="page-header">
        <div>
          <h1>{{ t('web.guilds.title') }}</h1>
          <p class="muted">{{ t('web.guilds.subtitle') }}</p>
        </div>
        <Button
          :label="t('web.guilds.refresh')"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="load(true)"
        />
      </div>

      <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

      <div v-if="!guilds && !error" class="grid">
        <Skeleton v-for="n in 6" :key="n" height="5.5rem" border-radius="12px" />
      </div>

      <p v-else-if="guilds && !guilds.length" class="panel muted">{{ t('web.guilds.empty') }}</p>

      <div v-else-if="guilds" class="grid">
        <div
          v-for="guild in guilds"
          :key="guild.id"
          class="panel guild"
          :class="{ off: !guild.hasBot }"
        >
          <GuildAvatar :guild="guild" />
          <div class="guild-info">
            <strong>{{ guild.name }}</strong>
            <small v-if="!guild.hasBot" class="muted">{{ t('web.guilds.noBot') }}</small>
          </div>
          <Button
            v-if="guild.hasBot"
            as="router-link"
            :to="{ name: 'overview', params: { guildId: guild.id } }"
            :label="t('web.guilds.manage')"
            size="small"
          />
          <Button
            v-else
            as="a"
            :href="invite(guild.id)"
            target="_blank"
            rel="noopener"
            :label="t('web.guilds.invite')"
            icon="pi pi-plus"
            size="small"
            severity="secondary"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.guilds-page {
  min-height: 100vh;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--mn-border);
  background: rgba(28, 23, 19, 0.7);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 5;
}

.brand {
  font-family: var(--mn-font-display);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--mn-gold-soft);
}

.page {
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.guild {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  transition: border-color 0.15s;
}

.guild:hover {
  border-color: var(--mn-gold);
}

.guild.off {
  opacity: 0.75;
}

.guild-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.guild-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .page {
    padding: 1.25rem 1rem;
  }

  .topbar {
    padding: 0.75rem 1rem;
  }
}
</style>
