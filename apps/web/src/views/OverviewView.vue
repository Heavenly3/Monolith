<script setup lang="ts">
import { MODULES } from '@monolith/core/browser';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import { computed } from 'vue';
import ActivityChart from '../components/ActivityChart.vue';
import GuildAvatar from '../components/GuildAvatar.vue';
import StatCard from '../components/StatCard.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { describeAudit } from '../lib/audit.ts';
import { useLoader } from '../lib/composables.ts';
import { compactNumber, formatNumber, relativeTime } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import { tabRoute } from '../lib/sections.ts';
import type { Overview } from '../lib/types.ts';

// The server at a glance: modules, key numbers of every system, the last
// week of economy activity, both rankings and the latest changes.
const guild = useGuild();
const { data, error } = useLoader(() => api.get<Overview>(guildPath(guild.value.id)));

const to = (section: 'general' | 'economy' | 'levels', tab: string) => ({
  name: tabRoute(section, tab),
  params: { guildId: guild.value.id },
});

const modulesOn = computed(() =>
  data.value ? MODULES.filter((id) => data.value!.modules[id]).length : 0,
);

// Smaller systems, each a row linking to the page that manages it.
const systems = computed(() => {
  const d = data.value;
  if (!d) return [];
  return [
    {
      icon: 'pi pi-ticket',
      label: t('web.overview.lottery'),
      value: formatNumber(d.raffle.pot),
      hint: d.raffle.drawAt
        ? `${t('web.overview.tickets', { count: d.raffle.tickets })} · ${t('web.overview.drawAt', { time: relativeTime(d.raffle.drawAt) })}`
        : t('web.overview.noDraw'),
      to: to('economy', 'lottery'),
    },
    {
      icon: 'pi pi-file-edit',
      label: t('web.overview.activeLoans'),
      value: formatNumber(d.activeLoans),
      to: to('economy', 'loans'),
    },
    {
      icon: 'pi pi-shopping-bag',
      label: t('web.overview.items'),
      value: formatNumber(d.products),
      to: to('economy', 'shop'),
    },
    {
      icon: 'pi pi-gift',
      label: t('web.overview.rewards'),
      value: formatNumber(d.levels.rewards),
      to: to('levels', 'rewards'),
    },
    {
      icon: 'pi pi-globe',
      label: t('web.overview.publicRanking'),
      value: d.levels.publicLeaderboard ? t('config.on') : t('config.off'),
      to: to('levels', 'ranking'),
    },
  ];
});

const medals = ['🥇', '🥈', '🥉'];
const place = (index: number) => medals[index] ?? `${index + 1}.`;
</script>

<template>
  <div class="page">
    <header class="hero">
      <GuildAvatar :guild="guild" size="xlarge" />
      <div class="hero-text">
        <p class="eyebrow">{{ t('web.overview.eyebrow') }}</p>
        <h1>{{ guild.name }}</h1>
        <p v-if="data" class="muted">
          {{ t('web.overview.modulesOn', { on: modulesOn, total: MODULES.length }) }}
        </p>
      </div>
    </header>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <template v-if="!data && !error">
      <div class="grid stats">
        <Skeleton v-for="n in 4" :key="n" height="5.5rem" border-radius="12px" />
      </div>
      <Skeleton height="16rem" border-radius="12px" />
    </template>

    <template v-else-if="data">
      <nav class="modules" :aria-label="t('config.categories.modules.label')">
        <RouterLink
          v-for="id in MODULES"
          :key="id"
          :to="to('general', 'modules')"
          class="module"
          :class="{ off: !data.modules[id] }"
        >
          <span class="dot" />
          {{ t(`modules.${id}`) }}
          <small>{{ data.modules[id] ? t('config.on') : t('config.off') }}</small>
        </RouterLink>
      </nav>

      <div class="grid stats">
        <StatCard
          icon="pi pi-wallet"
          :label="t('web.overview.total')"
          :value="data.stats.wallets + data.stats.banks"
          :hint="t('web.overview.membersCount', { count: formatNumber(data.stats.accounts) })"
        />
        <StatCard
          icon="pi pi-users"
          :label="t('web.overview.levelMembers')"
          :value="data.levels.stats.members"
          :hint="t('web.overview.totalXp', { xp: compactNumber(data.levels.stats.totalXp) })"
        />
        <StatCard
          icon="pi pi-bolt"
          :label="t('web.overview.activeWeek')"
          :value="data.levels.activeWeek"
          :hint="t('web.overview.activeWeekHint')"
        />
        <StatCard
          icon="pi pi-angle-double-up"
          :label="t('web.levels.topLevel')"
          :value="data.levels.stats.topLevel"
        />
      </div>

      <section class="panel stack">
        <div class="row between">
          <div>
            <h2 class="divider-title">{{ t('web.overview.activity.title') }}</h2>
            <p class="muted">{{ t('web.overview.activity.subtitle') }}</p>
          </div>
        </div>
        <ActivityChart :days="data.activity" />
      </section>

      <div class="columns">
        <section class="panel stack">
          <div class="row between">
            <h2 class="divider-title">{{ t('web.overview.top') }}</h2>
            <RouterLink :to="to('economy', 'members')" class="more">
              {{ t('web.overview.seeAll') }} <i class="pi pi-arrow-right" />
            </RouterLink>
          </div>
          <p v-if="!data.top.length" class="muted">{{ t('web.overview.noMembers') }}</p>
          <ol v-else class="top">
            <li v-for="(member, index) in data.top" :key="member.userId">
              <span class="place">{{ place(index) }}</span>
              <span class="who">{{ member.username ?? member.userId }}</span>
              <span v-tooltip.top="formatNumber(member.netWorth)" class="amount">
                {{ compactNumber(member.netWorth) }}
              </span>
            </li>
          </ol>
        </section>

        <section class="panel stack">
          <div class="row between">
            <h2 class="divider-title">{{ t('web.overview.topLevels') }}</h2>
            <RouterLink :to="to('levels', 'ranking')" class="more">
              {{ t('web.overview.seeAll') }} <i class="pi pi-arrow-right" />
            </RouterLink>
          </div>
          <p v-if="!data.levels.top.length" class="muted">{{ t('levels.boardEmpty') }}</p>
          <ol v-else class="top">
            <li v-for="(member, index) in data.levels.top" :key="member.userId">
              <span class="place">{{ place(index) }}</span>
              <span class="who">
                {{ member.username ?? member.userId }}
                <span class="bar"><i :style="{ width: `${member.progress.ratio * 100}%` }" /></span>
              </span>
              <span class="level">{{ t('levels.level') }} {{ member.level }}</span>
            </li>
          </ol>
        </section>
      </div>

      <div class="columns">
        <section class="panel stack">
          <h2 class="divider-title">{{ t('web.overview.systems') }}</h2>
          <ul class="systems">
            <li v-for="item in systems" :key="item.label">
              <RouterLink :to="item.to">
                <i :class="item.icon" class="system-icon" />
                <span class="system-text">
                  <span>{{ item.label }}</span>
                  <small v-if="item.hint" class="muted">{{ item.hint }}</small>
                </span>
                <strong class="amount">{{ item.value }}</strong>
                <i class="pi pi-angle-right muted" />
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="panel stack">
          <div class="row between">
            <h2 class="divider-title">{{ t('web.overview.recent') }}</h2>
            <RouterLink :to="{ name: 'history', params: { guildId: guild.id } }" class="more">
              {{ t('web.overview.seeAll') }} <i class="pi pi-arrow-right" />
            </RouterLink>
          </div>
          <p v-if="!data.recent.length" class="muted">{{ t('web.history.empty') }}</p>
          <ul v-else class="recent">
            <li v-for="entry in data.recent" :key="entry.id">
              <span class="who">
                <strong>{{ entry.actorName ?? entry.actorId }}</strong>
                <span class="muted">{{ describeAudit(entry) }}</span>
              </span>
              <small class="muted">{{ relativeTime(entry.createdAt) }}</small>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero h1 {
  margin: 0.1rem 0;
  font-size: 1.6rem;
}

.hero-text p {
  margin: 0;
}

.eyebrow {
  color: var(--mn-accent);
  font-family: var(--mn-font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.modules {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.module {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--mn-border);
  border-radius: 999px;
  background: var(--mn-panel);
  color: var(--mn-text);
  text-decoration: none;
  font-size: 0.85rem;
  transition: border-color 0.15s ease;
}

.module:hover {
  border-color: var(--mn-accent);
}

.module small {
  color: var(--mn-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5fd068;
  box-shadow: 0 0 6px rgba(95, 208, 104, 0.6);
}

.module.off .dot {
  background: var(--mn-muted);
  box-shadow: none;
}

.module.off {
  color: var(--mn-muted);
}

.between {
  justify-content: space-between;
  align-items: flex-start;
}

.more {
  font-size: 0.85rem;
  color: var(--mn-accent);
  text-decoration: none;
  white-space: nowrap;
}

.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.top,
.systems,
.recent {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.top li,
.recent li {
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
  flex-shrink: 0;
}

.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar {
  height: 3px;
  border-radius: 2px;
  background: var(--mn-border);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--mn-accent);
}

.level {
  font-weight: 600;
  color: var(--mn-accent-soft);
  white-space: nowrap;
}

.systems a {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  background: var(--mn-panel-raised);
  color: var(--mn-text);
  text-decoration: none;
  transition: background 0.15s ease;
}

.systems a:hover {
  background: color-mix(in srgb, var(--mn-accent) 10%, var(--mn-panel-raised));
}

.system-icon {
  color: var(--mn-accent);
  width: 1.2rem;
  text-align: center;
}

.system-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.recent li small {
  white-space: nowrap;
}

@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
