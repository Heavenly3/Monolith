// Settings editable from the admin panel, grouped by category. Shared by the
// bot (/config) and the future web dashboard. Labels live in the locale files
// under config.categories.<id> and config.fields.<id>.<field>.
import { LANGUAGES } from '@spacebet/i18n';
import type { SettingKey } from './defaults.ts';
import { parseDuration, parseWholeNumber } from '../utils/parse.ts';

export type FieldType = 'coins' | 'percent' | 'duration' | 'language';

export interface SettingField {
  id: string;
  key: SettingKey;
  /** Property inside an object setting (e.g. work.range.min). */
  path?: string;
  type: FieldType;
  min?: number;
}

export interface SettingCategory {
  fields: SettingField[];
  /** Cross-field validation; returns a translation key on error. */
  validate?: (values: Record<string, unknown>) => string | null;
}

export const SETTING_CATEGORIES = {
  general: { fields: [{ id: 'language', key: 'general.language', type: 'language' }] },
  work: {
    fields: [
      { id: 'min', key: 'work.range', path: 'min', type: 'coins' },
      { id: 'max', key: 'work.range', path: 'max', type: 'coins' },
      { id: 'cooldown', key: 'work.cooldown', type: 'duration' },
    ],
    validate: (values) => (Number(values.min) > Number(values.max) ? 'config.minMax' : null),
  },
  collect: { fields: [{ id: 'cooldown', key: 'collect.cooldown', type: 'duration' }] },
  wheel: { fields: [{ id: 'cooldown', key: 'wheel.cooldown', type: 'duration' }] },
  games: {
    fields: [
      { id: 'slots', key: 'slots.cooldown', type: 'duration' },
      { id: 'roulette', key: 'roulette.cooldown', type: 'duration' },
      { id: 'horserace', key: 'horserace.cooldown', type: 'duration' },
      { id: 'keno', key: 'keno.cooldown', type: 'duration' },
      { id: 'rob', key: 'rob.cooldown', type: 'duration' },
    ],
  },
  loans: {
    fields: [
      { id: 'rate', key: 'loan.interestRate', type: 'percent' },
      { id: 'duration', key: 'loan.duration', type: 'duration' },
      { id: 'max', key: 'loan.maxAmount', type: 'coins', min: 1 },
    ],
  },
  raffle: {
    fields: [
      { id: 'price', key: 'raffle.ticketPrice', type: 'coins', min: 1 },
      { id: 'pot', key: 'raffle.basePot', type: 'coins' },
      { id: 'delay', key: 'raffle.drawDelay', type: 'duration' },
    ],
  },
} satisfies Record<string, SettingCategory>;

export type SettingCategoryId = keyof typeof SETTING_CATEGORIES;

export function isSettingCategory(id: string): id is SettingCategoryId {
  return id in SETTING_CATEGORIES;
}

const MAX_DURATION = 365 * 86400;

/** Parses a value typed by an admin. Returns null when it is invalid. */
export function parseFieldValue(field: SettingField, text: string): unknown {
  const input = text.trim();
  switch (field.type) {
    case 'coins': {
      const value = parseWholeNumber(input);
      return value !== null && value >= (field.min ?? 0) ? value : null;
    }
    case 'percent': {
      const value = Number(input.replace('%', ''));
      return Number.isInteger(value) && value >= 0 && value <= 1000 ? value : null;
    }
    case 'duration': {
      const seconds = parseDuration(input);
      return seconds && seconds > 0 && seconds <= MAX_DURATION ? seconds : null;
    }
    case 'language':
      return input === 'auto' || (LANGUAGES as string[]).includes(input) ? input : null;
  }
}
