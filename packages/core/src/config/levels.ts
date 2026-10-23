// Level curve math, shared by the bot and the dashboard chart.
import type { LevelCurve, LevelFormula } from './defaults.ts';

/** Built-in curves; "custom" uses the server's own formula. */
export const CURVES: Record<Exclude<LevelCurve, 'custom'>, LevelFormula> = {
  gentle: { cubic: 0, quadratic: 2, linear: 30, constant: 80 },
  standard: { cubic: 0, quadratic: 5, linear: 50, constant: 100 },
  steep: { cubic: 0, quadratic: 10, linear: 80, constant: 150 },
};

export interface CurveSettings {
  curve: LevelCurve;
  /** 100 = normal; 200 needs twice the XP. */
  difficulty: number;
  maxLevel: number;
  /** Coefficients of the "custom" curve. */
  formula?: LevelFormula;
  /** XP per level is rounded to a multiple of this (1 or less = exact). */
  rounding?: number;
}

export const formulaOf = ({ curve, formula }: CurveSettings): LevelFormula =>
  curve === 'custom' ? (formula ?? CURVES.standard) : CURVES[curve];

/** XP needed to go from `level` to the next one. */
export function xpToNext(level: number, settings: CurveSettings): number {
  const { cubic, quadratic, linear, constant } = formulaOf(settings);
  const raw =
    ((cubic * level ** 3 + quadratic * level ** 2 + linear * level + constant) *
      settings.difficulty) /
    100;
  const step = Math.max(1, Math.floor(settings.rounding ?? 1));
  return Math.max(1, Math.round(raw / step) * step);
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
