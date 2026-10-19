import { formatDuration, settings, type SettingField } from '@mythcore/core';
import type { Translator } from '@mythcore/i18n';
import { coins } from './format.ts';

/** Raw value of a settings field in a server. */
export function readField(guildId: string, field: SettingField): unknown {
  const value = settings.get(guildId, field.key) as unknown;
  return field.path ? (value as Record<string, unknown>)[field.path] : value;
}

/** Value prefilled in the edit form. */
export function inputValue(guildId: string, field: SettingField): string {
  const value = readField(guildId, field);
  return field.type === 'duration'
    ? formatDuration(Number(value)).replaceAll(' ', '')
    : String(value);
}

/** Value as shown to people. */
export function displayField(guildId: string, field: SettingField, t: Translator): string {
  const value = readField(guildId, field);
  switch (field.type) {
    case 'coins':
      return coins(Number(value));
    case 'percent':
      return `${value}%`;
    case 'duration':
      return formatDuration(Number(value));
    case 'language':
      return t(`config.languages.${value}`);
  }
}

/** "Label · value" lines (with explanation) for a list of fields. */
export function settingLines(
  guildId: string,
  categoryId: string,
  fields: SettingField[],
  t: Translator,
): string {
  return fields
    .map(
      (field) =>
        `**${t(`config.fields.${categoryId}.${field.id}.label`)}** · ${displayField(guildId, field, t)}\n-# ${t(`config.fields.${categoryId}.${field.id}.help`)}`,
    )
    .join('\n');
}
