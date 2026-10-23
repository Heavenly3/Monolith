<script setup lang="ts">
import { RANK_COLORS, rankCardSvg, type RankColor } from '@monolith/core/browser';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';
import { me } from '../lib/session.ts';

// The same SVG the bot turns into the /rank image, filled with sample numbers.
const props = defineProps<{ styleId: string; color: string }>();

const svg = computed(() =>
  rankCardSvg({
    name: me.value?.username ?? 'Kael',
    avatar: null,
    level: 12,
    rank: 3,
    xp: 8450,
    current: 1230,
    needed: 2000,
    messages: 312,
    color: ((RANK_COLORS as readonly string[]).includes(props.color)
      ? props.color
      : 'cyan') as RankColor,
    labels: {
      level: t('levels.level'),
      rank: t('levels.rank'),
      xp: 'XP',
      messages: t('levels.messages'),
      max: t('levels.maxLevel'),
    },
  }),
);
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ t('web.rankCard.title') }}</h2>
      <p class="muted">
        {{ styleId === 'image' ? t('web.rankCard.subtitle') : t(`web.rankCard.${styleId}`) }}
      </p>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -- built from our own template, names escaped -->
    <div v-if="styleId === 'image'" class="card" v-html="svg" />
  </section>
</template>

<style scoped>
.card :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}
</style>
