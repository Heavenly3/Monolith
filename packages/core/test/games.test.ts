import { describe, expect, it } from 'vitest';
import { HORSERACE, KENO, ROULETTE_BETS, SLOTS, rules, type RouletteBet } from '../src/index.ts';

// Exact expected value (total return per coin bet) of every game: it must stay
// below 1 so nobody can farm money, but close enough to be fun.
const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return result;
};

describe('house edge', () => {
  it('slots', () => {
    let ev = 0;
    const symbols = SLOTS.symbols;
    for (const a of symbols)
      for (const b of symbols)
        for (const c of symbols) ev += rules.evaluateSlots([a, b, c]).multiplier;
    ev /= symbols.length ** 3;
    expect(ev).toBeGreaterThan(0.85);
    expect(ev).toBeLessThan(1);
  });

  it('roulette', () => {
    for (const bet of Object.keys(ROULETTE_BETS) as RouletteBet[]) {
      let ev = 0;
      for (let number = 0; number <= 36; number++) {
        ev += rules.spinRoulette(bet, bet === 'straight' ? 17 : null, number).multiplier;
      }
      ev /= 37;
      expect(ev, bet).toBeLessThan(1);
      expect(ev, bet).toBeGreaterThan(0.9);
    }
  });

  it('horse race', () => {
    const total = Object.values(HORSERACE.payouts).reduce((sum, m) => sum + m, 0);
    expect(total / HORSERACE.horses.length).toBeLessThan(1);
  });

  it('keno', () => {
    for (let spots = 1; spots <= KENO.maxSpots; spots++) {
      let ev = 0;
      for (let hits = 0; hits <= spots; hits++) {
        const probability =
          (choose(spots, hits) * choose(KENO.poolSize - spots, KENO.drawSize - hits)) /
          choose(KENO.poolSize, KENO.drawSize);
        ev += probability * (KENO.paytable[spots]?.[hits] ?? 0);
      }
      expect(ev, `${spots} spots`).toBeLessThan(1);
      expect(ev, `${spots} spots`).toBeGreaterThan(0.85);
    }
  });
});

describe('rules', () => {
  it('roulette colours and special cases', () => {
    expect(rules.rouletteColor(0)).toBe('green');
    expect(rules.rouletteColor(1)).toBe('red');
    expect(rules.rouletteColor(2)).toBe('black');
    expect(rules.rouletteWins('column1', 0, null)).toBe(false);
    expect(rules.rouletteWins('straight', 0, 0)).toBe(true);
    expect(rules.rouletteWins('column1', 4, null)).toBe(true);
    expect(rules.rouletteWins('dozen3', 25, null)).toBe(true);
  });

  it('keno number parsing', () => {
    expect(rules.parseKenoNumbers('3, 1 2')).toEqual({ ok: true, numbers: [1, 2, 3] });
    expect(rules.parseKenoNumbers('1 1')).toEqual({ ok: false, error: 'repeated' });
    expect(rules.parseKenoNumbers('99')).toEqual({ ok: false, error: 'badRange' });
    expect(rules.parseKenoNumbers('1 2 3 4 5 6 7 8 9 10 11')).toEqual({
      ok: false,
      error: 'badCount',
    });
    expect(rules.quickPick(5)).toHaveLength(5);
  });

  it('horse race places', () => {
    expect(rules.runRace(3, [3, 1, 2, 0, 4, 5, 6, 7, 8, 9])).toMatchObject({
      place: 1,
      multiplier: 6,
    });
    expect(rules.runRace(0, [3, 1, 2, 0, 4, 5, 6, 7, 8, 9])).toMatchObject({
      place: 4,
      multiplier: 0,
    });
  });
});
