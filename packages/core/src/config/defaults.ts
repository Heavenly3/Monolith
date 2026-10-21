import type { Language } from '@mythcore/i18n';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Systems a server can switch on or off. */
export const MODULES = ['economy', 'games', 'shop', 'loans', 'lottery', 'levels'] as const;
export type ModuleId = (typeof MODULES)[number];

export const LEVEL_CURVES = ['gentle', 'standard', 'steep'] as const;
export type LevelCurve = (typeof LEVEL_CURVES)[number];

export const LEVEL_ANNOUNCE = ['channel', 'custom', 'dm', 'off'] as const;
export type LevelAnnounce = (typeof LEVEL_ANNOUNCE)[number];

export const REWARD_MODES = ['stack', 'replace'] as const;
export type RewardMode = (typeof REWARD_MODES)[number];

export interface LevelReward {
  level: number;
  roleId: string;
}

/** XP multiplier for members with a role or messages in a channel (100 = normal). */
export interface XpMultiplier {
  type: 'role' | 'channel';
  id: string;
  percent: number;
}

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

  'modules.economy': boolean;
  'modules.games': boolean;
  'modules.shop': boolean;
  'modules.loans': boolean;
  'modules.lottery': boolean;
  'modules.levels': boolean;

  /** XP per message, picked at random in the range. */
  'levels.xp': { min: number; max: number };
  /** Seconds before another message gives XP again. */
  'levels.cooldown': number;
  /** Gold given on every level up (0 = none). */
  'levels.coinsPerLevel': number;
  'levels.curve': LevelCurve;
  /** Scales the XP needed per level (100 = normal). */
  'levels.difficulty': number;
  'levels.maxLevel': number;
  'levels.voice': boolean;
  /** XP per minute in a voice channel with someone else. */
  'levels.voiceXp': number;
  'levels.announce': LevelAnnounce;
  'levels.announceChannel': string | null;
  /** null uses the built-in message, translated to each reply's language. */
  'levels.announceMessage': string | null;
  /** Announce only every N levels (1 = every level). Reward levels are always announced. */
  'levels.announceEvery': number;
  'levels.ignoredChannels': string[];
  'levels.ignoredRoles': string[];
  'levels.rewardMode': RewardMode;
  'levels.rewards': LevelReward[];
  'levels.multipliers': XpMultiplier[];
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

  'modules.economy': true,
  'modules.games': true,
  'modules.shop': true,
  'modules.loans': true,
  'modules.lottery': true,
  'modules.levels': true,

  'levels.xp': { min: 15, max: 25 },
  'levels.cooldown': MINUTE,
  'levels.coinsPerLevel': 0,
  'levels.curve': 'standard',
  'levels.difficulty': 100,
  'levels.maxLevel': 500,
  'levels.voice': false,
  'levels.voiceXp': 5,
  'levels.announce': 'channel',
  'levels.announceChannel': null,
  'levels.announceMessage': null,
  'levels.announceEvery': 1,
  'levels.ignoredChannels': [],
  'levels.ignoredRoles': [],
  'levels.rewardMode': 'stack',
  'levels.rewards': [],
  'levels.multipliers': [],
};

export const SETTING_KEYS = Object.keys(DEFAULTS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return key in DEFAULTS;
}
