import { randomInt } from 'node:crypto';

/** Integer in [min, max] (both inclusive), cryptographically secure. */
export function randomBetween(min: number, max: number): number {
  return randomInt(min, max + 1);
}

/** Float in [min, max). */
export function randomFloat(min = 0, max = 1): number {
  return min + (randomInt(0, 2 ** 32) / 2 ** 32) * (max - min);
}

export function pick<T>(items: readonly T[]): T {
  return items[randomInt(items.length)]!;
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** `count` distinct integers from [min, max]. */
export function sample(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return shuffle(pool).slice(0, count);
}
