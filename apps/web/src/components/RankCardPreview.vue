<script setup lang="ts">
import { RANK_THEMES, rankCardSvg, type RankTheme } from '@monolith/core/browser';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';
import { me } from '../lib/session.ts';

// The same SVG the bot turns into the /rank image, with sample numbers and
// the design being edited (theme, colour, background), before it is saved.
const props = defineProps<{
  styleId: string;
  theme: string;
  accent: string;
  background: string | null;
  dim: number;
}>();

const sample = (rank: number | null, level: number, current: number, needed: number) =>
  rankCardSvg({
    name: me.value?.username ?? 'Kael',
    avatar: me.value?.avatar
      ? `https://cdn.discordapp.com/avatars/${me.value.id}/${me.value.avatar}.png?size=256`
      : null,
    level,
    rank,
    xp: 8450,
    current,
    needed,
    messages: 312,
    design: {
      theme: ((RANK_THEMES as readonly string[]).includes(props.theme)
        ? props.theme
        : 'blueprint') as RankTheme,
      accent: props.accent,
      background: props.background?.startsWith('https://') ? props.background : null,
      dim: props.dim,
    },
    labels: {
      level: t('levels.level'),
      rank: t('levels.rank'),
      xp: 'XP',
      messages: t('levels.messages'),
      max: t('levels.maxLevel'),
    },
  });

const cards = computed(() => [sample(3, 12, 1230, 2000), sample(1, 1, 8, 155)]);
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ t('web.rankCard.title') }}</h2>
      <p class="muted">
        {{ styleId === 'image' ? t('web.rankCard.subtitle') : t(`web.rankCard.${styleId}`) }}
      </p>
    </div>
    <template v-if="styleId === 'image'">
      <!-- eslint-disable-next-line vue/no-v-html -- built from our own template, texts escaped -->
      <div v-for="(svg, index) in cards" :key="index" class="card" v-html="svg" />
    </template>
    <div v-else-if="styleId === 'embed'" class="embed" :style="{ borderColor: accent }">
      <strong>{{ me?.username ?? 'Kael' }}</strong>
      <span>
        <b>{{ t('levels.level') }} 12</b> ({{ t('levels.rank') }} #3)
      </span>
      <span class="bar"><i :style="{ width: '61%', background: accent }" /></span>
      <small class="muted"
        >1,230 / 2,000 XP (61%) · 8,450 XP · 312 {{ t('levels.messages') }}</small
      >
    </div>
  </section>
</template>

<style scoped>
.card :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}

.embed {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 28rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid;
  border-radius: 4px;
  background: var(--mn-panel-raised);
}

.bar {
  height: 6px;
  border-radius: 3px;
  background: var(--mn-border);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
}
</style>
