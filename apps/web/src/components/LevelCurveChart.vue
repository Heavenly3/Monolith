<script setup lang="ts">
import {
  LEVEL_CURVES,
  totalXpFor,
  type LevelCurve,
  type LevelFormula,
} from '@monolith/core/browser';
import { computed } from 'vue';
import { t } from '../i18n/index.ts';
import { compactNumber, formatDuration, formatNumber } from '../lib/format.ts';

// Total XP needed per level for the curve being edited, plus how many
// messages and how much active chat that takes with the current XP settings.
const props = defineProps<{
  curve: string;
  difficulty: number;
  maxLevel: number;
  /** Coefficients used by the "custom" curve. */
  formula: LevelFormula;
  rounding: number;
  /** Average XP of one message and the cooldown between counted messages. */
  xpPerMessage: number;
  cooldown: number;
}>();

const settings = computed(() => ({
  curve: ((LEVEL_CURVES as readonly string[]).includes(props.curve)
    ? props.curve
    : 'standard') as LevelCurve,
  difficulty: Math.max(10, props.difficulty || 100),
  maxLevel: Math.max(1, props.maxLevel || 1),
  formula: props.formula,
  rounding: props.rounding,
}));

const axisLabel = (value: number): string =>
  value >= 10_000
    ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(
        value,
      )
    : compactNumber(value);

const lastLevel = computed(() => Math.min(settings.value.maxLevel, 100));
const points = computed(() =>
  Array.from({ length: lastLevel.value + 1 }, (_, level) => totalXpFor(level, settings.value)),
);

const W = 640;
const H = 220;
const PAD = { left: 56, right: 16, top: 16, bottom: 28 };

const path = computed(() => {
  const max = points.value.at(-1) || 1;
  return points.value
    .map((xp, level) => {
      const x = PAD.left + (level / lastLevel.value) * (W - PAD.left - PAD.right);
      const y = H - PAD.bottom - (xp / max) * (H - PAD.top - PAD.bottom);
      return `${level === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
const area = computed(
  () => `${path.value} L${W - PAD.right},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`,
);
const yTicks = computed(() => {
  const max = points.value.at(-1) || 1;
  return [0, 0.5, 1].map((share) => ({
    y: H - PAD.bottom - share * (H - PAD.top - PAD.bottom),
    label: axisLabel(Math.round(max * share)),
  }));
});
const xTicks = computed(() =>
  [0, 0.25, 0.5, 0.75, 1].map((share) => ({
    x: PAD.left + share * (W - PAD.left - PAD.right),
    label: Math.round(lastLevel.value * share),
  })),
);

const milestones = computed(() =>
  [5, 10, 25, 50, 100]
    .filter((level) => level <= settings.value.maxLevel)
    .map((level) => {
      const xp = totalXpFor(level, settings.value);
      const messages = Math.ceil(xp / Math.max(1, props.xpPerMessage));
      return {
        level,
        xp: formatNumber(xp),
        messages: formatNumber(messages),
        time: formatDuration(messages * props.cooldown),
      };
    }),
);
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ t('web.curve.title') }}</h2>
      <p class="muted">{{ t('web.curve.subtitle') }}</p>
    </div>
    <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" :aria-label="t('web.curve.title')">
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ec8e5" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#5ec8e5" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g class="grid">
        <line
          v-for="tick in yTicks"
          :key="tick.y"
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="tick.y"
          :y2="tick.y"
        />
      </g>
      <text
        v-for="tick in yTicks"
        :key="`y${tick.y}`"
        :x="PAD.left - 8"
        :y="tick.y + 4"
        class="axis end"
      >
        {{ tick.label }}
      </text>
      <text v-for="tick in xTicks" :key="`x${tick.x}`" :x="tick.x" :y="H - 8" class="axis middle">
        {{ tick.label }}
      </text>
      <path :d="area" fill="url(#curve-fill)" />
      <path :d="path" class="line" />
    </svg>

    <div class="table-wrap">
      <table class="milestones">
        <thead>
          <tr>
            <th>{{ t('levels.level') }}</th>
            <th class="num">{{ t('web.curve.totalXp') }}</th>
            <th class="num">{{ t('web.curve.messages') }}</th>
            <th class="num">{{ t('web.curve.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in milestones" :key="row.level">
            <td>
              <strong>{{ row.level }}</strong>
            </td>
            <td class="num amount">{{ row.xp }}</td>
            <td class="num">≈ {{ row.messages }}</td>
            <td class="num">≈ {{ row.time }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <small class="muted">{{ t('web.curve.note') }}</small>
  </section>
</template>

<style scoped>
.chart {
  width: 100%;
  height: auto;
}

.grid line {
  stroke: var(--mn-border);
  stroke-dasharray: 3 4;
}

.axis {
  fill: var(--mn-muted);
  font-size: 11px;
  font-family: var(--mn-font-body);
}

.axis.end {
  text-anchor: end;
}

.axis.middle {
  text-anchor: middle;
}

.line {
  fill: none;
  stroke: var(--mn-accent);
  stroke-width: 2.5;
  stroke-linejoin: round;
  transition: d 0.3s ease;
}

.table-wrap {
  overflow-x: auto;
}

.milestones {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.milestones th,
.milestones td {
  padding: 0.45rem 0.6rem;
  border-bottom: 1px solid var(--mn-border);
  text-align: left;
}

.milestones th {
  color: var(--mn-muted);
  font-weight: 500;
  font-size: 0.85rem;
}

.milestones .num {
  text-align: right;
}
</style>
