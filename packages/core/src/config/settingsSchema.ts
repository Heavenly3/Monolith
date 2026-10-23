// Settings editable from the bot (/config) and the web dashboard, grouped by
// category. Both apps build their forms from this schema and validate with
// parseFieldValue, so they always agree. Labels live in the locale files
// under config.categories.<id> and config.fields.<id>.<field>.
import { LANGUAGES } from '@monolith/i18n';
import {
  CHANNEL_MULTIPLIER_MODES,
  LEVEL_ANNOUNCE,
  LEVEL_CURVES,
  REWARD_MODES,
  ROLE_MULTIPLIER_MODES,
  SYNC_MODES,
  type ModuleId,
  type SettingKey,
} from './defaults.ts';
import { parseDuration, parseWholeNumber } from '../utils/parse.ts';

export type FieldType =
  | 'coins'
  | 'percent'
  | 'duration'
  | 'language'
  | 'number'
  | 'decimal'
  | 'toggle'
  | 'choice'
  | 'channel'
  | 'channels'
  | 'roles'
  | 'template';

export interface SettingField {
  id: string;
  key: SettingKey;
  /** Property inside an object setting (e.g. work.range.min). */
  path?: string;
  type: FieldType;
  min?: number;
  max?: number;
  /** Values of a "choice" field; labels live under config.choices.<field id>. */
  options?: readonly string[];
  /** Placeholders a "template" can use, e.g. ['user', 'level']. */
  variables?: readonly string[];
  /** Longest text (templates) or most items (channel and role lists). */
  limit?: number;
  /** Empty value allowed: a channel field may be unset, a template falls back to the built-in text. */
  optional?: boolean;
}

export type CategoryGroup = 'general' | 'economy' | 'levels';

export interface SettingCategory {
  group: CategoryGroup;
  /** The module this category belongs to, if any. */
  module?: ModuleId;
  fields: SettingField[];
  /** Cross-field validation; returns a translation key on error. */
  validate?: (values: Record<string, unknown>) => string | null;
}

const minBelowMax = (values: Record<string, unknown>): string | null =>
  Number(values.min) > Number(values.max) ? 'config.minMax' : null;

export const LEVEL_VARIABLES = [
  'user',
  'username',
  'level',
  'xp',
  'rank',
  'role',
  'server',
] as const;

export const SETTING_CATEGORIES = {
  general: {
    group: 'general',
    fields: [{ id: 'language', key: 'general.language', type: 'language' }],
  },
  modules: {
    group: 'general',
    fields: [
      { id: 'economy', key: 'modules.economy', type: 'toggle' },
      { id: 'games', key: 'modules.games', type: 'toggle' },
      { id: 'shop', key: 'modules.shop', type: 'toggle' },
      { id: 'loans', key: 'modules.loans', type: 'toggle' },
      { id: 'lottery', key: 'modules.lottery', type: 'toggle' },
      { id: 'levels', key: 'modules.levels', type: 'toggle' },
    ],
  },
  work: {
    group: 'economy',
    module: 'economy',
    fields: [
      { id: 'min', key: 'work.range', path: 'min', type: 'coins' },
      { id: 'max', key: 'work.range', path: 'max', type: 'coins' },
      { id: 'cooldown', key: 'work.cooldown', type: 'duration' },
    ],
    validate: minBelowMax,
  },
  collect: {
    group: 'economy',
    module: 'economy',
    fields: [{ id: 'cooldown', key: 'collect.cooldown', type: 'duration' }],
  },
  wheel: {
    group: 'economy',
    module: 'economy',
    fields: [{ id: 'cooldown', key: 'wheel.cooldown', type: 'duration' }],
  },
  games: {
    group: 'economy',
    module: 'games',
    fields: [
      { id: 'slots', key: 'slots.cooldown', type: 'duration' },
      { id: 'roulette', key: 'roulette.cooldown', type: 'duration' },
      { id: 'horserace', key: 'horserace.cooldown', type: 'duration' },
      { id: 'keno', key: 'keno.cooldown', type: 'duration' },
      { id: 'rob', key: 'rob.cooldown', type: 'duration' },
    ],
  },
  loans: {
    group: 'economy',
    module: 'loans',
    fields: [
      { id: 'rate', key: 'loan.interestRate', type: 'percent' },
      { id: 'duration', key: 'loan.duration', type: 'duration' },
      { id: 'max', key: 'loan.maxAmount', type: 'coins', min: 1 },
    ],
  },
  raffle: {
    group: 'economy',
    module: 'lottery',
    fields: [
      { id: 'price', key: 'raffle.ticketPrice', type: 'coins', min: 1 },
      { id: 'pot', key: 'raffle.basePot', type: 'coins' },
      { id: 'delay', key: 'raffle.drawDelay', type: 'duration' },
    ],
  },
  levels: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'min', key: 'levels.xp', path: 'min', type: 'number', min: 1, max: 1000 },
      { id: 'max', key: 'levels.xp', path: 'max', type: 'number', min: 1, max: 1000 },
      { id: 'cooldown', key: 'levels.cooldown', type: 'duration' },
      { id: 'coins', key: 'levels.coinsPerLevel', type: 'coins' },
    ],
    validate: minBelowMax,
  },
  levelCurve: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'curve', key: 'levels.curve', type: 'choice', options: LEVEL_CURVES },
      { id: 'difficulty', key: 'levels.difficulty', type: 'percent', min: 10, max: 1000 },
      { id: 'maxLevel', key: 'levels.maxLevel', type: 'number', min: 1, max: 1000 },
    ],
  },
  levelFormula: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'cubic', key: 'levels.formula', path: 'cubic', type: 'decimal', max: 1000 },
      { id: 'quadratic', key: 'levels.formula', path: 'quadratic', type: 'decimal', max: 10_000 },
      { id: 'linear', key: 'levels.formula', path: 'linear', type: 'decimal', max: 100_000 },
      { id: 'constant', key: 'levels.formula', path: 'constant', type: 'decimal', max: 1_000_000 },
      { id: 'rounding', key: 'levels.rounding', type: 'number', min: 1, max: 10_000 },
    ],
    validate: (values) =>
      ['cubic', 'quadratic', 'linear', 'constant'].every((id) => Number(values[id]) === 0)
        ? 'config.formulaEmpty'
        : null,
  },
  levelMultipliers: {
    group: 'levels',
    module: 'levels',
    fields: [
      {
        id: 'roleMode',
        key: 'levels.roleMultiplierMode',
        type: 'choice',
        options: ROLE_MULTIPLIER_MODES,
      },
      {
        id: 'channelMode',
        key: 'levels.channelMultiplierMode',
        type: 'choice',
        options: CHANNEL_MULTIPLIER_MODES,
      },
    ],
  },
  levelRoles: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'rewardMode', key: 'levels.rewardMode', type: 'choice', options: REWARD_MODES },
      { id: 'syncMode', key: 'levels.syncMode', type: 'choice', options: SYNC_MODES },
    ],
  },
  levelVoice: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'enabled', key: 'levels.voice', type: 'toggle' },
      { id: 'xp', key: 'levels.voiceXp', type: 'number', min: 1, max: 1000 },
    ],
  },
  levelAnnounce: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'mode', key: 'levels.announce', type: 'choice', options: LEVEL_ANNOUNCE },
      { id: 'channel', key: 'levels.announceChannel', type: 'channel', optional: true },
      {
        id: 'message',
        key: 'levels.announceMessage',
        type: 'template',
        variables: LEVEL_VARIABLES,
        limit: 500,
        optional: true,
      },
      { id: 'every', key: 'levels.announceEvery', type: 'number', min: 1, max: 100 },
    ],
    validate: (values) =>
      values.mode === 'custom' && !values.channel ? 'config.channelRequired' : null,
  },
  levelFilters: {
    group: 'levels',
    module: 'levels',
    fields: [
      { id: 'channels', key: 'levels.ignoredChannels', type: 'channels', limit: 25 },
      { id: 'roles', key: 'levels.ignoredRoles', type: 'roles', limit: 25 },
    ],
  },
} satisfies Record<string, SettingCategory>;

export type SettingCategoryId = keyof typeof SETTING_CATEGORIES;

export function isSettingCategory(id: string): id is SettingCategoryId {
  return id in SETTING_CATEGORIES;
}

const MAX_DURATION = 365 * 86400;
const SNOWFLAKE = /^\d{17,20}$/;

const text = (raw: unknown): string => (typeof raw === 'string' ? raw : String(raw ?? '')).trim();

function inRange(value: number | null, field: SettingField, fallbackMax: number): number | null {
  if (value === null) return null;
  return value >= (field.min ?? 0) && value <= (field.max ?? fallbackMax) ? value : null;
}

/** Snowflake list from an array or a comma/space separated string. */
function idList(raw: unknown, limit: number): string[] | null {
  const items = Array.isArray(raw)
    ? raw.map(String)
    : text(raw)
        .split(/[\s,]+/)
        .filter(Boolean);
  const unique = [...new Set(items.map((item) => item.trim()))];
  return unique.length <= limit && unique.every((id) => SNOWFLAKE.test(id)) ? unique : null;
}

/**
 * Parses a value typed or picked by an admin. Text inputs arrive as strings;
 * the dashboard may also send numbers, booleans and arrays. Returns
 * `undefined` when the value is invalid (null is a valid "unset").
 */
export function parseFieldValue(field: SettingField, raw: unknown): unknown {
  const input = text(raw);
  switch (field.type) {
    case 'coins':
      return inRange(parseWholeNumber(input), field, Number.MAX_SAFE_INTEGER) ?? undefined;
    case 'number':
      return inRange(parseWholeNumber(input), field, 1_000_000) ?? undefined;
    case 'decimal': {
      const value = Number(input.replace(',', '.'));
      if (!input || !Number.isFinite(value)) return undefined;
      const rounded = Math.round(value * 100) / 100;
      return inRange(rounded, field, 1_000_000) ?? undefined;
    }
    case 'percent': {
      const value = Number(input.replace('%', ''));
      return Number.isInteger(value) ? (inRange(value, field, 1000) ?? undefined) : undefined;
    }
    case 'duration': {
      const seconds = parseDuration(input);
      return seconds && seconds > 0 && seconds <= MAX_DURATION ? seconds : undefined;
    }
    case 'language':
      return input === 'auto' || (LANGUAGES as string[]).includes(input) ? input : undefined;
    case 'toggle':
      if (raw === true || input === 'true' || input === 'on' || input === '1') return true;
      if (raw === false || input === 'false' || input === 'off' || input === '0') return false;
      return undefined;
    case 'choice':
      return field.options?.includes(input) ? input : undefined;
    case 'channel':
      if (!input) return field.optional ? null : undefined;
      return SNOWFLAKE.test(input) ? input : undefined;
    case 'channels':
    case 'roles':
      return idList(raw, field.limit ?? 25) ?? undefined;
    case 'template':
      if (!input) return field.optional ? null : undefined;
      return input.length <= (field.limit ?? 500) ? input : undefined;
  }
}
