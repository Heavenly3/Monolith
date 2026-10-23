import type { Language } from '@monolith/i18n';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Systems a server can switch on or off. */
export const MODULES = ['economy', 'games', 'shop', 'loans', 'lottery', 'levels'] as const;
export type ModuleId = (typeof MODULES)[number];

export const LEVEL_CURVES = ['gentle', 'standard', 'steep', 'custom'] as const;
export type LevelCurve = (typeof LEVEL_CURVES)[number];

export const LEVEL_ANNOUNCE = ['channel', 'custom', 'dm', 'off'] as const;
export type LevelAnnounce = (typeof LEVEL_ANNOUNCE)[number];

/** A level-up as a component card, or as plain text. */
export const ANNOUNCE_STYLES = ['card', 'plain'] as const;
export type AnnounceStyle = (typeof ANNOUNCE_STYLES)[number];

/** Message used instead of the usual one when a member reaches one exact level. */
export interface LevelMessage {
  level: number;
  message: string;
}

export const REWARD_MODES = ['stack', 'replace'] as const;
export type RewardMode = (typeof REWARD_MODES)[number];

/**
 * When reward roles are checked against the level: on every XP gain (heals
 * roles removed by hand), only when the level changes, or never (roles are
 * only added on level up).
 */
export const SYNC_MODES = ['xp', 'level', 'never'] as const;
export type SyncMode = (typeof SYNC_MODES)[number];

/** How the multipliers of several roles combine. "highest" uses the highest role in the list. */
export const ROLE_MULTIPLIER_MODES = ['largest', 'smallest', 'highest', 'add', 'multiply'] as const;
export type RoleMultiplierMode = (typeof ROLE_MULTIPLIER_MODES)[number];

/** How the role and the channel multiplier combine; "channel"/"role" let one replace the other. */
export const CHANNEL_MULTIPLIER_MODES = ['multiply', 'add', 'largest', 'channel', 'role'] as const;
export type ChannelMultiplierMode = (typeof CHANNEL_MULTIPLIER_MODES)[number];

export interface LevelReward {
  level: number;
  roleId: string;
  /** Kept when a higher reward replaces it ("replace" mode). */
  keep?: boolean;
  /** Given once on reaching the level and never added back or removed automatically. */
  noSync?: boolean;
}

/**
 * XP multiplier for members with a role, or messages in a channel or a
 * category of channels (100 = normal, 0 = no XP).
 */
export interface XpMultiplier {
  type: 'role' | 'channel';
  id: string;
  percent: number;
}

/** XP from level L to L+1 = cubic·L³ + quadratic·L² + linear·L + constant. */
export interface LevelFormula {
  cubic: number;
  quadratic: number;
  linear: number;
  constant: number;
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
  /** Credits every new member starts with. */
  'economy.startBalance': number;
  /** Most credits (wallet + bank) earnings can take a member to; 0 = no limit. */
  'economy.maxBalance': number;
  'bet.min': number;
  /** 0 = no limit. */
  'bet.max': number;
  /** Chance of a robbery succeeding, in percent. */
  'rob.chance': number;
  /** Most of the victim's wallet a robbery takes, in percent. */
  'rob.steal': number;
  /** Most of the thief's wallet a failed robbery costs, in percent. */
  'rob.fine': number;
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
  /** Credits given on every level up (0 = none). */
  'levels.coinsPerLevel': number;
  'levels.curve': LevelCurve;
  /** Scales the XP needed per level (100 = normal). */
  'levels.difficulty': number;
  'levels.maxLevel': number;
  /** Coefficients of the "custom" curve. */
  'levels.formula': LevelFormula;
  /** XP per level is rounded to a multiple of this (1 = exact). */
  'levels.rounding': number;
  'levels.voice': boolean;
  /** XP per minute in a voice channel with someone else. */
  'levels.voiceXp': number;
  'levels.announce': LevelAnnounce;
  'levels.announceChannel': string | null;
  /** null uses the built-in message, translated to each reply's language. */
  'levels.announceMessage': string | null;
  /** Announce only every N levels (1 = every level). Reward levels are always announced. */
  'levels.announceEvery': number;
  /** After this level every level is announced again (0 = the "every" rule never stops). */
  'levels.announceUntil': number;
  /** Only announce levels that give a reward role. */
  'levels.announceRewardsOnly': boolean;
  /** Whether the announcement notifies the member. */
  'levels.announcePing': boolean;
  'levels.announceStyle': AnnounceStyle;
  'levels.levelMessages': LevelMessage[];
  /** Anyone with the link can see the ranking on the web, without logging in. */
  'levels.publicLeaderboard': boolean;
  'levels.ignoredChannels': string[];
  'levels.ignoredRoles': string[];
  'levels.rewardMode': RewardMode;
  'levels.syncMode': SyncMode;
  'levels.rewards': LevelReward[];
  'levels.multipliers': XpMultiplier[];
  'levels.roleMultiplierMode': RoleMultiplierMode;
  'levels.channelMultiplierMode': ChannelMultiplierMode;
}

export type SettingKey = keyof SettingValues;

export const DEFAULTS: SettingValues = {
  'general.language': 'auto',
  'economy.startBalance': 0,
  'economy.maxBalance': 0,
  'bet.min': 100,
  'bet.max': 0,
  'rob.chance': 45,
  'rob.steal': 40,
  'rob.fine': 25,

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
  'levels.formula': { cubic: 0, quadratic: 5, linear: 50, constant: 100 },
  'levels.rounding': 1,
  'levels.voice': false,
  'levels.voiceXp': 5,
  'levels.announce': 'channel',
  'levels.announceChannel': null,
  'levels.announceMessage': null,
  'levels.announceEvery': 1,
  'levels.announceUntil': 0,
  'levels.announceRewardsOnly': false,
  'levels.announcePing': true,
  'levels.announceStyle': 'card',
  'levels.levelMessages': [],
  'levels.publicLeaderboard': false,
  'levels.ignoredChannels': [],
  'levels.ignoredRoles': [],
  'levels.rewardMode': 'stack',
  'levels.syncMode': 'xp',
  'levels.rewards': [],
  'levels.multipliers': [],
  'levels.roleMultiplierMode': 'largest',
  'levels.channelMultiplierMode': 'multiply',
};

export const SETTING_KEYS = Object.keys(DEFAULTS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return key in DEFAULTS;
}
