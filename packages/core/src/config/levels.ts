// Level curve math, shared by the bot and the dashboard chart.
import type { LevelCurve } from './defaults.ts';

/** XP to go from level L to L+1 is a·L² + b·L + c, scaled by the difficulty. */
export const CURVES: Record<LevelCurve, { a: number; b: number; c: number }> = {
  gentle: { a: 2, b: 30, c: 80 },
  standard: { a: 5, b: 50, c: 100 },
  steep: { a: 10, b: 80, c: 150 },
};

export interface CurveSettings {
  curve: LevelCurve;
  /** 100 = normal; 200 needs twice the XP. */
  difficulty: number;
  maxLevel: number;
}

/** XP needed to go from `level` to the next one. */
export function xpToNext(level: number, { curve, difficulty }: CurveSettings): number {
  const { a, b, c } = CURVES[curve];
  return Math.max(1, Math.round(((a * level * level + b * level + c) * difficulty) / 100));
}

/** Total XP needed to reach `level` from zero. */
export function totalXpFor(level: number, settings: CurveSettings): number {
  let total = 0;
  for (let current = 0; current < level; current++) total += xpToNext(current, settings);
  return total;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level. */
  current: number;
  /** XP the current level needs in total (0 at the maximum level). */
  needed: number;
  /** Share of the current level done, 0 to 1. */
  ratio: number;
}

/** Level reached with `xp` total experience, and the progress towards the next one. */
export function progressFor(xp: number, settings: CurveSettings): LevelProgress {
  let level = 0;
  let remaining = Math.max(0, xp);
  while (level < settings.maxLevel) {
    const needed = xpToNext(level, settings);
    if (remaining < needed) return { level, current: remaining, needed, ratio: remaining / needed };
    remaining -= needed;
    level++;
  }
  return { level, current: 0, needed: 0, ratio: 1 };
}

export const levelFor = (xp: number, settings: CurveSettings): number =>
  progressFor(xp, settings).level;
