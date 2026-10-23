<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { lang, t } from '../i18n/index.ts';
import { compactNumber, formatNumber } from '../lib/format.ts';
import type { DayActivity } from '../lib/types.ts';

// Credits earned and spent per day: two series in one unit, paired bars on a
// single axis. The colours are checked against the dark panel (see the
// dataviz palette checks); a tooltip and a hidden table carry every value.
const props = defineProps<{ days: DayActivity[] }>();

const SERIES = [
  { key: 'earned', color: '#2d9fc0' },
  { key: 'spent', color: '#c07f22' },
] as const;

// Drawn at the real width of its box, so labels keep their size on phones.
const plot = ref<HTMLElement | null>(null);
const W = ref(640);
const H = 220;
const PAD = { left: 52, right: 8, top: 12, bottom: 28 };
const plotW = computed(() => W.value - PAD.left - PAD.right);
const plotH = H - PAD.top - PAD.bottom;

let observer: ResizeObserver | null = null;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    if (entry) W.value = Math.max(280, Math.round(entry.contentRect.width));
  });
  if (plot.value) observer.observe(plot.value);
});
onBeforeUnmount(() => observer?.disconnect());

const max = computed(() => {
  const top = Math.max(1, ...props.days.flatMap((d) => [d.earned, d.spent]));
  // Round the axis up to a tidy number so the gridlines read well.
  const step = 10 ** Math.floor(Math.log10(top));
  return Math.ceil(top / step) * step;
});

const dayLabel = (day: number): string =>
  new Intl.DateTimeFormat(lang.value, { weekday: 'short', timeZone: 'UTC' }).format(day);
const fullDate = (day: number): string =>
  new Intl.DateTimeFormat(lang.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(day);

const slot = computed(() => plotW.value / Math.max(1, props.days.length));
const barW = computed(() => Math.min(22, (slot.value - 16) / 2));

const bars = computed(() =>
  props.days.map((day, i) => {
    const center = PAD.left + slot.value * (i + 0.5);
    return {
      day,
      center,
      marks: SERIES.map((series, s) => {
        const value = day[series.key];
        const h = value > 0 ? Math.max(2, (value / max.value) * plotH) : 0;
        const x = center + (s === 0 ? -barW.value - 1 : 1);
        return { ...series, value, x, y: PAD.top + plotH - h, h };
      }),
    };
  }),
);

const ticks = computed(() =>
  [0, 0.5, 1].map((share) => ({
    y: PAD.top + plotH - share * plotH,
    label: compactNumber(Math.round(max.value * share)),
  })),
);

/** Rounded top, square bottom: the bar stays anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

const hovered = ref<number | null>(null);
// The tooltip follows the day but stays inside the chart near the edges.
const tipLeft = computed(() =>
  tip.value ? Math.min(82, Math.max(18, (tip.value.center / W.value) * 100)) : 0,
);
const tip = computed(() => (hovered.value === null ? null : bars.value[hovered.value]));
const totals = computed(() => ({
  earned: props.days.reduce((sum, d) => sum + d.earned, 0),
  spent: props.days.reduce((sum, d) => sum + d.spent, 0),
  movements: props.days.reduce((sum, d) => sum + d.movements, 0),
}));
const empty = computed(() => totals.value.movements === 0);
</script>

<template>
  <div class="activity">
    <div class="legend" aria-hidden="true">
      <span v-for="series in SERIES" :key="series.key" class="key">
        <i :style="{ background: series.color }" />{{ t(`web.overview.activity.${series.key}`) }}
        <strong class="amount">{{ formatNumber(totals[series.key]) }}</strong>
      </span>
    </div>

    <div ref="plot" class="plot">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="t('web.overview.activity.title')">
        <g class="grid">
          <line
            v-for="tick in ticks"
            :key="tick.y"
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="tick.y"
            :y2="tick.y"
          />
        </g>
        <text
          v-for="tick in ticks"
          :key="`t${tick.y}`"
          :x="PAD.left - 8"
          :y="tick.y + 4"
          class="axis end"
        >
          {{ tick.label }}
        </text>
        <g
          v-for="(group, i) in bars"
          :key="group.day.day"
          class="day"
          :class="{ dim: hovered !== null && hovered !== i }"
          tabindex="0"
          @pointerenter="hovered = i"
          @pointerleave="hovered = null"
          @focus="hovered = i"
          @blur="hovered = null"
        >
          <!-- The whole day column is the hit target, not just the thin bars. -->
          <rect
            :x="group.center - slot / 2"
            :y="PAD.top"
            :width="slot"
            :height="plotH"
            class="hit"
          />
          <path
            v-for="mark in group.marks.filter((m) => m.h > 0)"
            :key="mark.key"
            :d="barPath(mark.x, mark.y, barW, mark.h)"
            :fill="mark.color"
          />
          <text :x="group.center" :y="H - 8" class="axis middle">
            {{ dayLabel(group.day.day) }}
          </text>
        </g>
        <line
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="PAD.top + plotH"
          :y2="PAD.top + plotH"
          class="baseline"
        />
      </svg>

      <div v-if="tip" class="tooltip" :style="{ left: `${tipLeft}%` }" role="status">
        <small class="muted">{{ fullDate(tip.day.day) }}</small>
        <div v-for="mark in tip.marks" :key="mark.key" class="tip-row">
          <i :style="{ background: mark.color }" />
          <strong class="amount">{{ formatNumber(mark.value) }}</strong>
          <span class="muted">{{ t(`web.overview.activity.${mark.key}`) }}</span>
        </div>
        <small class="muted">
          {{
            t('web.overview.activity.movements', {
              movements: formatNumber(tip.day.movements),
              members: formatNumber(tip.day.members),
            })
          }}
        </small>
      </div>
      <p v-if="empty" class="empty muted">{{ t('web.overview.activity.empty') }}</p>
    </div>

    <table class="sr-only">
      <caption>
        {{
          t('web.overview.activity.title')
        }}
      </caption>
      <tr>
        <th>{{ t('web.history.when') }}</th>
        <th>{{ t('web.overview.activity.earned') }}</th>
        <th>{{ t('web.overview.activity.spent') }}</th>
      </tr>
      <tr v-for="day in days" :key="day.day">
        <td>{{ fullDate(day.day) }}</td>
        <td>{{ day.earned }}</td>
        <td>{{ day.spent }}</td>
      </tr>
    </table>
  </div>
</template>

<style scoped>
.activity {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  font-size: 0.85rem;
  color: var(--mn-muted);
}

.key {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.key i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.key strong {
  color: var(--mn-text);
}

.plot {
  position: relative;
}

svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.grid line {
  stroke: var(--mn-border);
  stroke-dasharray: 3 4;
}

.baseline {
  stroke: var(--mn-border);
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
  text-transform: capitalize;
}

.day {
  outline: none;
  transition: opacity 0.15s ease;
}

.day.dim {
  opacity: 0.45;
}

.day:focus-visible .hit {
  stroke: var(--mn-accent);
}

.hit {
  fill: transparent;
}

.tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  min-width: 11rem;
  white-space: nowrap;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--mn-border);
  border-radius: 8px;
  background: var(--mn-panel-raised);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 2;
}

.tip-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.tip-row i {
  width: 12px;
  height: 2px;
}

.empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
