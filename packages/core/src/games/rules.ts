// Pure game rules: no database, no Discord. Randomness is injectable so the
// rules can be tested exhaustively.
import {
  HORSERACE,
  KENO,
  ROULETTE,
  SLOTS,
  type RouletteBet,
  type SlotSymbol,
} from '../config/games.ts';
import { pick, randomBetween, sample, shuffle } from '../utils/random.ts';

// ── Slots ────────────────────────────────────────────────────────────────

export type SlotOutcome = 'jackpot' | 'triple' | 'pair' | 'none';

export function evaluateSlots(reels: readonly SlotSymbol[]): {
  outcome: SlotOutcome;
  multiplier: number;
} {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    return a === SLOTS.jackpotSymbol
      ? { outcome: 'jackpot', multiplier: SLOTS.payouts.jackpot }
      : { outcome: 'triple', multiplier: SLOTS.payouts.triple };
  }
  if (a === b || b === c || a === c) return { outcome: 'pair', multiplier: SLOTS.payouts.pair };
  return { outcome: 'none', multiplier: 0 };
}

export function spinSlots(): { reels: SlotSymbol[]; outcome: SlotOutcome; multiplier: number } {
  const reels = [pick(SLOTS.symbols), pick(SLOTS.symbols), pick(SLOTS.symbols)];
  return { reels, ...evaluateSlots(reels) };
}

// ── Roulette ─────────────────────────────────────────────────────────────

export type RouletteColor = 'red' | 'black' | 'green';
const RED = new Set<number>(ROULETTE.redNumbers);

export function rouletteColor(number: number): RouletteColor {
  if (number === 0) return 'green';
  return RED.has(number) ? 'red' : 'black';
}

export function rouletteWins(bet: RouletteBet, number: number, pick: number | null): boolean {
  if (number === 0) return bet === 'straight' && pick === 0;
  switch (bet) {
    case 'red':
    case 'black':
      return rouletteColor(number) === bet;
    case 'even':
      return number % 2 === 0;
    case 'odd':
      return number % 2 === 1;
    case 'low':
      return number <= 18;
    case 'high':
      return number >= 19;
    case 'dozen1':
    case 'dozen2':
    case 'dozen3':
      return Math.ceil(number / 12) === Number(bet.at(-1));
    case 'column1':
    case 'column2':
    case 'column3':
      return ((number - 1) % 3) + 1 === Number(bet.at(-1));
    case 'straight':
      return number === pick;
  }
}

export function spinRoulette(bet: RouletteBet, pick: number | null, number = randomBetween(0, 36)) {
  const won = rouletteWins(bet, number, pick);
  return {
    number,
    color: rouletteColor(number),
    won,
    multiplier: won ? ROULETTE.bets[bet].multiplier : 0,
  };
}

// ── Horse race ───────────────────────────────────────────────────────────

/** Runs a race. `order` lists horse indexes from first to last. */
export function runRace(
  chosen: number,
  order = shuffle(HORSERACE.horses.map((_, index) => index)),
) {
  const place = order.indexOf(chosen) + 1;
  return { order, place, multiplier: HORSERACE.payouts[place] ?? 0 };
}

// ── Keno ─────────────────────────────────────────────────────────────────

export type KenoParse =
  { ok: true; numbers: number[] } | { ok: false; error: 'badRange' | 'repeated' | 'badCount' };

/** Parses "1, 7 23 42" into unique sorted numbers. */
export function parseKenoNumbers(input: string): KenoParse {
  const numbers = input
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number);
  if (numbers.some((n) => !Number.isInteger(n) || n < 1 || n > KENO.poolSize)) {
    return { ok: false, error: 'badRange' };
  }
  const unique = [...new Set(numbers)];
  if (unique.length !== numbers.length) return { ok: false, error: 'repeated' };
  if (unique.length < 1 || unique.length > KENO.maxSpots) return { ok: false, error: 'badCount' };
  return { ok: true, numbers: unique.sort((a, b) => a - b) };
}

export function quickPick(count: number): number[] {
  return sample(1, KENO.poolSize, count).sort((a, b) => a - b);
}

export function playKeno(picks: number[], drawn = sample(1, KENO.poolSize, KENO.drawSize)) {
  const drawnSet = new Set(drawn);
  const hits = picks.filter((n) => drawnSet.has(n));
  return {
    drawn: [...drawn].sort((a, b) => a - b),
    hits,
    multiplier: KENO.paytable[picks.length]?.[hits.length] ?? 0,
  };
}
