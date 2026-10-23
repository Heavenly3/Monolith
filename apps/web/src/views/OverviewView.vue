<script setup lang="ts">
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import PageHeader from '../components/PageHeader.vue';
import StatCard from '../components/StatCard.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader } from '../lib/composables.ts';
import { formatNumber, relativeTime } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import type { Overview } from '../lib/types.ts';

const guild = useGuild();
const { data, error } = useLoader(() => api.get<Overview>(guildPath(guild.value.id)));
const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
</script>

<template>
  <div class="page">
    <PageHeader :title="guild.name" :subtitle="t('web.nav.overview')" />
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-if="!data && !error" class="grid">
      <Skeleton v-for="n in 4" :key="n" height="5.5rem" border-radius="12px" />
    </div>

    <template v-else-if="data">
      <div class="grid">
        <StatCard
          icon="pi pi-users"
          :label="t('web.overview.members')"
          :value="data.stats.accounts"
        />
        <StatCard
          icon="pi pi-wallet"
          :label="t('web.overview.wallets')"
          :value="data.stats.wallets"
        />
        <StatCard
          icon="pi pi-building-columns"
          :label="t('web.overview.banks')"
          :value="data.stats.banks"
        />
        <StatCard
          icon="pi pi-chart-line"
          :label="t('web.overview.total')"
          :value="data.stats.wallets + data.stats.banks"
        />
      </div>

      <div class="columns">
        <section class="panel stack">
          <h2 class="divider-title">{{ t('web.overview.top') }}</h2>
          <p v-if="!data.top.length" class="muted">{{ t('web.overview.noMembers') }}</p>
          <ol v-else class="top">
            <li v-for="(member, index) in data.top" :key="member.userId">
              <span class="place">{{ medals[index] }}</span>
              <span class="who">{{ member.username ?? member.userId }}</span>
              <span class="gold">{{ formatNumber(member.netWorth) }}</span>
            </li>
          </ol>
        </section>

        <div class="stack">
          <StatCard
            icon="pi pi-ticket"
            :label="t('web.overview.lottery')"
            :value="data.raffle.pot"
            :hint="
              data.raffle.drawAt
                ? `${t('web.overview.tickets', { count: data.raffle.tickets })} · ${t('web.overview.drawAt', { time: relativeTime(data.raffle.drawAt) })}`
                : t('web.overview.noDraw')
            "
          />
          <StatCard
            icon="pi pi-file-edit"
            :label="t('web.overview.activeLoans')"
            :value="data.activeLoans"
          />
          <StatCard
            icon="pi pi-shopping-bag"
            :label="t('web.overview.items')"
            :value="data.products"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.grid {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1rem;
}

.top {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.top li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  background: var(--mn-panel-raised);
}

.place {
  width: 1.75rem;
  text-align: center;
}

.who {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 800px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
