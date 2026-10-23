<script setup lang="ts">
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Skeleton from 'primevue/skeleton';
import { computed, ref } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import GuildAvatar from '../components/GuildAvatar.vue';
import LanguagePicker from '../components/LanguagePicker.vue';
import { t } from '../i18n/index.ts';
import { ApiError, api } from '../lib/api.ts';
import { compactNumber, formatNumber, initials } from '../lib/format.ts';

// Level ranking of a server, open to anyone once its admins turn it on.
interface Entry {
  rank: number;
  userId: string;
  username: string | null;
  xp: number;
  level: number;
  messages: number;
  progress: { level: number; current: number; needed: number; ratio: number };
}
interface Board {
  guild: { id: string; name: string; icon: string | null };
  total: number;
  members: Entry[];
}

const props = defineProps<{ guildId: string }>();
const PAGE_SIZE = 50;

const board = ref<Board | null>(null);
const members = ref<Entry[]>([]);
const missing = ref(false);
const failed = ref(false);
const loading = ref(false);
let page = 0;

async function load(): Promise<void> {
  loading.value = true;
  try {
    const next = await api.get<Board>(
      `/api/public/${props.guildId}/leaderboard?page=${page}&limit=${PAGE_SIZE}`,
    );
    board.value = next;
    members.value.push(...next.members);
    page++;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) missing.value = true;
    else failed.value = true;
  } finally {
    loading.value = false;
  }
}
void load();

const hasMore = computed(() => board.value !== null && members.value.length < board.value.total);
const podium = (rank: number) => (rank <= 3 ? `podium-${rank}` : '');
</script>

<template>
  <main class="public">
    <header class="top">
      <BrandLogo :size="28" />
      <LanguagePicker />
    </header>

    <section v-if="missing || failed" class="panel empty">
      <i class="pi pi-lock" />
      <h1>{{ t(missing ? 'web.public.missingTitle' : 'web.public.failedTitle') }}</h1>
      <p class="muted">{{ t(missing ? 'web.public.missing' : 'web.public.failed') }}</p>
    </section>

    <template v-else>
      <section class="hero">
        <GuildAvatar v-if="board" :guild="board.guild" size="xlarge" />
        <Skeleton v-else width="4rem" height="4rem" />
        <div>
          <p class="eyebrow">{{ t('web.public.eyebrow') }}</p>
          <h1>{{ board?.guild.name ?? '…' }}</h1>
          <p v-if="board" class="muted">
            {{ t('web.public.count', { count: formatNumber(board.total) }) }}
          </p>
        </div>
      </section>

      <ol v-if="board" class="board">
        <li v-if="!members.length" class="muted">{{ t('levels.boardEmpty') }}</li>
        <li v-for="entry in members" :key="entry.userId" :class="podium(entry.rank)">
          <span class="rank">#{{ entry.rank }}</span>
          <Avatar :label="initials(entry.username ?? '?')" shape="square" class="who-avatar" />
          <div class="who">
            <strong>{{ entry.username ?? t('web.public.unknown') }}</strong>
            <div class="bar" :aria-label="`${Math.floor(entry.progress.ratio * 100)}%`">
              <span :style="{ width: `${Math.floor(entry.progress.ratio * 100)}%` }" />
            </div>
          </div>
          <div class="numbers">
            <span class="level">{{ t('levels.level') }} {{ entry.level }}</span>
            <small class="amount">{{ compactNumber(entry.xp) }} XP</small>
          </div>
        </li>
      </ol>
      <div v-else class="board">
        <Skeleton v-for="n in 6" :key="n" height="3.5rem" />
      </div>

      <Button
        v-if="hasMore"
        :label="t('web.public.more')"
        icon="pi pi-angle-down"
        severity="secondary"
        outlined
        :loading="loading"
        class="more"
        @click="load"
      />
    </template>
    <footer class="muted">{{ t('web.public.footer') }}</footer>
  </main>
</template>

<style scoped>
.public {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.25rem 16px 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.hero h1 {
  margin: 0.1rem 0;
  font-size: 1.7rem;
}

.eyebrow {
  margin: 0;
  color: var(--mn-accent);
  font-family: var(--mn-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.board {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.board li {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--mn-border);
  border-radius: var(--mn-radius, 6px);
  background: var(--mn-panel);
  animation: rise 0.35s ease both;
}

.rank {
  min-width: 3rem;
  font-family: var(--mn-font-mono);
  color: var(--mn-muted);
}

.podium-1 {
  border-color: var(--mn-amber) !important;
}

.podium-1 .rank {
  color: var(--mn-amber);
}

.podium-2 .rank,
.podium-3 .rank {
  color: var(--mn-accent);
}

.who-avatar {
  background: var(--mn-panel-raised);
  flex-shrink: 0;
}

.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.who strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar {
  height: 4px;
  border-radius: 2px;
  background: var(--mn-panel-raised);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: var(--mn-accent);
}

.numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  white-space: nowrap;
}

.level {
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 3rem 1rem;
}

.empty .pi {
  font-size: 2rem;
  color: var(--mn-muted);
}

.more {
  align-self: center;
}

footer {
  text-align: center;
  font-size: 0.8rem;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (max-width: 480px) {
  .rank {
    min-width: 2.2rem;
  }
}
</style>
