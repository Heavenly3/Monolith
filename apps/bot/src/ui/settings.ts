import {
  formatDuration,
  formatNumber,
  settingsForm,
  truncate,
  type SettingField,
} from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { emojis } from './emojis.ts';
import { coins } from './format.ts';

/** Raw value of a settings field in a server. */
export const readField = (guildId: string, field: SettingField): unknown =>
  settingsForm.currentValue(guildId, field);

/** Value prefilled in a text input of the edit form. */
export function inputValue(guildId: string, field: SettingField): string {
  const value = readField(guildId, field);
  if (value === null || value === undefined) return '';
  return field.type === 'duration'
    ? formatDuration(Number(value)).replaceAll(' ', '')
    : String(value);
}

const ids = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Value as shown to people. */
export function displayField(guildId: string, field: SettingField, t: Translator): string {
  const value = readField(guildId, field);
  switch (field.type) {
    case 'coins':
      return coins(Number(value));
    case 'number':
      return `**${formatNumber(Number(value))}**`;
    case 'color':
      return `\`${value}\``;
    case 'url':
      return value ? `[${truncate(String(value), 40)}](${value})` : `*${t('config.notSet')}*`;
    case 'decimal':
      return `**${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}**`;
    case 'percent':
      return `**${value}%**`;
    case 'duration':
      return `**${formatDuration(Number(value))}**`;
    case 'language':
      return t(`config.languages.${value}`);
    case 'toggle':
      return value ? `${emojis.success} ${t('config.on')}` : `${emojis.error} ${t('config.off')}`;
    case 'choice':
      return t(`config.choices.${field.id}.${value}`);
    case 'channel':
      return value ? `<#${value}>` : `*${t('config.notSet')}*`;
    case 'channels':
      return ids(value).length
        ? ids(value)
            .map((id) => `<#${id}>`)
            .join(' ')
        : `*${t('common.none')}*`;
    case 'roles':
      return ids(value).length
        ? ids(value)
            .map((id) => `<@&${id}>`)
            .join(' ')
        : `*${t('common.none')}*`;
    case 'template':
      return value ? `“${truncate(String(value), 120)}”` : `*${t('config.builtIn')}*`;
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
