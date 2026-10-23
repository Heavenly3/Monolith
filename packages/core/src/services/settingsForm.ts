// Applies a submitted settings form (one category of SETTING_CATEGORIES).
// Shared by the bot panel and the web dashboard so both validate the same way.
import {
  SETTING_CATEGORIES,
  parseFieldValue,
  type SettingCategory,
  type SettingCategoryId,
  type SettingField,
} from '../config/settingsSchema.ts';
import { transaction } from '../db/database.ts';
import type { SettingKey, SettingValues } from '../config/defaults.ts';
import * as levels from './levels.ts';
import * as settings from './settings.ts';

// Work that must follow a change of some categories.
const AFTER_SAVE: Partial<Record<SettingCategoryId, (guildId: string) => void>> = {
  // Stored levels depend on the curve.
  levelCurve: levels.recalculate,
  levelFormula: levels.recalculate,
};

export type FormResult =
  | { ok: true; changed: SettingKey[] }
  | { ok: false; reason: 'invalid'; field: SettingField }
  /** Cross-field rule failed; `messageKey` is a translation key. */
  | { ok: false; reason: 'rule'; messageKey: string };

/** Current value of one field (a property of an object setting when it has a path). */
export function currentValue(guildId: string, field: SettingField): unknown {
  const value = settings.get(guildId, field.key) as unknown;
  return field.path ? (value as Record<string, unknown>)[field.path] : value;
}

export function fieldsOf(categoryId: SettingCategoryId): SettingField[] {
  return (SETTING_CATEGORIES[categoryId] as SettingCategory).fields;
}

/**
 * Validates every field first, then saves them together. `input` returns the
 * submitted value of a field: text from a form, or any JSON value from the
 * dashboard. Fields it returns `undefined` for keep their current value.
 */
export function applyForm(
  guildId: string,
  categoryId: SettingCategoryId,
  input: (fieldId: string) => unknown,
): FormResult {
  const category = SETTING_CATEGORIES[categoryId] as SettingCategory;
  const values: Record<string, unknown> = {};

  const submitted = new Set<string>();
  for (const field of category.fields) {
    const raw = input(field.id);
    if (raw === undefined) {
      values[field.id] = currentValue(guildId, field);
      continue;
    }
    const parsed = parseFieldValue(field, raw);
    if (parsed === undefined) return { ok: false, reason: 'invalid', field };
    values[field.id] = parsed;
    submitted.add(field.id);
  }

  const rule = category.validate?.(values);
  if (rule) return { ok: false, reason: 'rule', messageKey: rule };

  const updates = new Map<SettingKey, unknown>();
  for (const field of category.fields) {
    if (!submitted.has(field.id)) continue;
    if (field.path) {
      const current = (updates.get(field.key) ?? settings.get(guildId, field.key)) as Record<
        string,
        unknown
      >;
      updates.set(field.key, { ...current, [field.path]: values[field.id] });
    } else {
      updates.set(field.key, values[field.id]);
    }
  }

  transaction(() => {
    for (const [key, value] of updates)
      settings.set(guildId, key, value as SettingValues[typeof key]);
    AFTER_SAVE[categoryId]?.(guildId);
  });
  return { ok: true, changed: [...updates.keys()] };
}

/** Restores the defaults of every field of a category. */
export function resetCategory(guildId: string, categoryId: SettingCategoryId): void {
  settings.reset(guildId, ...new Set(fieldsOf(categoryId).map((field) => field.key)));
  AFTER_SAVE[categoryId]?.(guildId);
}
