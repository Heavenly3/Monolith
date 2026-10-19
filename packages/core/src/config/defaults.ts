import type { Language } from '@spacebet/i18n';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface WheelReward {
  /** Custom label; null shows the amount (or "Nothing" for 0). */
  name: string | null;
  amount: number;
}

/** Every setting a server can change, with its type. Durations are in seconds. */
export interface SettingValues {
  /** 'auto' replies in each member's Discord language. */
  'general.language': 'auto' | Language;
  /** null uses the built-in messages, translated to each reply's language. */
  'work.messages': string[] | null;
  'work.range': { min: number; max: number };
  'work.cooldown': number;
  'collect.cooldown': number;
  'wheel.rewards': WheelReward[];
  'wheel.cooldown': number;
  'slots.cooldown': number;
  'roulette.cooldown': number;
  'horserace.cooldown': number;
  'keno.cooldown': number;
  'rob.cooldown': number;
  'loan.interestRate': number;
  'loan.duration': number;
  'loan.maxAmount': number;
  'raffle.ticketPrice': number;
  'raffle.basePot': number;
  'raffle.drawDelay': number;
}

export type SettingKey = keyof SettingValues;

export const DEFAULTS: SettingValues = {
  'general.language': 'auto',

  'work.messages': null,
  'work.range': { min: 50, max: 250 },
  'work.cooldown': HOUR,

  'collect.cooldown': DAY,

  'wheel.rewards': [100, 250, 500, 1000, 0, 2000, 5000, 0, 10000, 0].map((amount) => ({
    name: null,
    amount,
  })),
  'wheel.cooldown': DAY,

  'slots.cooldown': 30,
  'roulette.cooldown': 30,
  'horserace.cooldown': 30,
  'keno.cooldown': 30,
  'rob.cooldown': 2 * HOUR,

  'loan.interestRate': 10,
  'loan.duration': DAY,
  'loan.maxAmount': 50000,

  'raffle.ticketPrice': 100,
  'raffle.basePot': 500,
  'raffle.drawDelay': 10 * MINUTE,
};

export const SETTING_KEYS = Object.keys(DEFAULTS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return key in DEFAULTS;
}
