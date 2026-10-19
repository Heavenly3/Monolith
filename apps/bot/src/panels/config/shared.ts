import {
  ButtonBuilder,
  ButtonStyle,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitFields,
  type SelectMenuComponentOptionData,
} from 'discord.js';
import { settingsForm, truncate, type SettingCategoryId } from '@spacebet/core';
import type { Translator } from '@spacebet/i18n';
import { emojis } from '../../ui/index.ts';
import { inputValue, settingLines } from '../../ui/settings.ts';

export { ButtonStyle };

/** Panel custom IDs: `config:act:<section>:<action>:<args...>` */
export const actionId = (section: string, action: string, ...args: string[]): string =>
  ['config', 'act', section, action, ...args].join(':');

export function button(
  section: string,
  action: string,
  label: string,
  emoji: string,
  style: ButtonStyle = ButtonStyle.Secondary,
): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(actionId(section, action))
    .setLabel(truncate(label, 80))
    .setEmoji(emoji)
    .setStyle(style);
}

/** Select menu that runs `action` with the picked value. Null when there is nothing to pick. */
export function picker(
  section: string,
  action: string,
  placeholder: string,
  options: SelectMenuComponentOptionData[],
): StringSelectMenuBuilder | null {
  if (!options.length) return null;
  return new StringSelectMenuBuilder()
    .setCustomId(actionId(section, action))
    .setPlaceholder(placeholder)
    .addOptions(
      options.slice(0, 25).map((option) => ({
        ...option,
        label: truncate(option.label, 100),
        description: option.description ? truncate(option.description, 100) : undefined,
      })),
    );
}

export function modal(section: string, action: string, title: string): ModalBuilder {
  return new ModalBuilder().setCustomId(actionId(section, action)).setTitle(truncate(title, 45));
}

export function textField(
  id: string,
  label: string,
  {
    description,
    value,
    required = true,
    paragraph = false,
    max = 100,
  }: {
    description?: string;
    value?: string;
    required?: boolean;
    paragraph?: boolean;
    max?: number;
  } = {},
): LabelBuilder {
  const input = new TextInputBuilder()
    .setCustomId(id)
    .setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
    .setRequired(required)
    .setMaxLength(max);
  if (value !== undefined) input.setValue(value);
  const field = new LabelBuilder().setLabel(truncate(label, 45)).setTextInputComponent(input);
  if (description) field.setDescription(truncate(description, 100));
  return field;
}

/** List with a "…and N more" tail so long lists fit in one message. */
export function list(lines: string[], t: Translator, limit = 12): string {
  if (lines.length <= limit) return lines.join('\n');
  return [...lines.slice(0, limit), `-# ${t('panel.more', { count: lines.length - limit })}`].join(
    '\n',
  );
}

/** "Label · value" lines for the settings of a category. */
export const categoryLines = (
  guildId: string,
  categoryId: SettingCategoryId,
  t: Translator,
): string => settingLines(guildId, categoryId, settingsForm.fieldsOf(categoryId), t);

/** Form to edit every value of a settings category. */
export function valuesModal(
  guildId: string,
  categoryId: SettingCategoryId,
  t: Translator,
): ModalBuilder {
  return modal(
    categoryId,
    'save',
    t('config.modalTitle', { category: t(`config.categories.${categoryId}.label`) }),
  ).addLabelComponents(
    settingsForm.fieldsOf(categoryId).map((field) =>
      textField(field.id, t(`config.fields.${categoryId}.${field.id}.label`), {
        description: t(`config.hints.${field.type}`),
        value: inputValue(guildId, field),
        max: 20,
      }),
    ),
  );
}

/** Validates and stores the values form. Returns an error message or null. */
export function saveValues(
  guildId: string,
  categoryId: SettingCategoryId,
  fields: ModalSubmitFields,
  t: Translator,
): string | null {
  const result = settingsForm.applyForm(guildId, categoryId, (id) => fields.getTextInputValue(id));
  if (result.ok) return null;
  if (result.reason === 'rule') return t(result.messageKey);
  return t('config.invalid', {
    field: t(`config.fields.${categoryId}.${result.field.id}.label`),
    hint: t(`config.hints.${result.field.type}`),
  });
}

export const editButton = (t: Translator, categoryId: string): ButtonBuilder =>
  button(categoryId, 'edit', t('config.edit'), emojis.edit, ButtonStyle.Primary);

export const resetButton = (
  t: Translator,
  categoryId: string,
  style = ButtonStyle.Secondary,
): ButtonBuilder => button(categoryId, 'reset', t('config.reset'), emojis.reset, style);
