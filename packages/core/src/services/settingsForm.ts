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
import * as settings from './settings.ts';

export type FormResult =
  | { ok: true; changed: SettingKey[] }
  | { ok: false; reason: 'invalid'; field: SettingField }
  /** Cross-field rule failed; `messageKey` is a translation key. */
  | { ok: false; reason: 'rule'; messageKey: string };

export function fieldsOf(categoryId: SettingCategoryId): SettingField[] {
  return (SETTING_CATEGORIES[categoryId] as SettingCategory).fields;
}

/** Validates every field first, then saves them together. */
export function applyForm(
  guildId: string,
  categoryId: SettingCategoryId,
  input: (fieldId: string) => string,
): FormResult {
  const category = SETTING_CATEGORIES[categoryId] as SettingCategory;
  const values: Record<string, unknown> = {};

  for (const field of category.fields) {
    const parsed = parseFieldValue(field, input(field.id));
    if (parsed === null) return { ok: false, reason: 'invalid', field };
    values[field.id] = parsed;
  }

  const rule = category.validate?.(values);
  if (rule) return { ok: false, reason: 'rule', messageKey: rule };

  const updates = new Map<SettingKey, unknown>();
  for (const field of category.fields) {
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
  });
  return { ok: true, changed: [...updates.keys()] };
}

/** Restores the defaults of every field of a category. */
export function resetCategory(guildId: string, categoryId: SettingCategoryId): void {
  settings.reset(guildId, ...new Set(fieldsOf(categoryId).map((field) => field.key)));
}
