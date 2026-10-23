import {
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  CheckboxBuilder,
  LabelBuilder,
  ModalBuilder,
  RadioGroupBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalSubmitFields,
  type SelectMenuComponentOptionData,
} from 'discord.js';
import { settingsForm, truncate, type SettingCategoryId, type SettingField } from '@monolith/core';
import { LANGUAGES, type Translator } from '@monolith/i18n';
import { emojis } from '../../ui/index.ts';
import { displayField, inputValue, readField, settingLines } from '../../ui/settings.ts';

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

const TEXT_CHANNELS = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

/** Explanation under a form field: what to type, or which variables a message can use. */
function fieldHint(field: SettingField, t: Translator): string {
  if (field.type === 'template') {
    const variables = (field.variables ?? []).map((name) => `{${name}}`).join(' ');
    return t('config.hints.template', { variables });
  }
  return t(`config.hints.${field.type}`);
}

/** The input that edits one field: text, checkbox, options or a channel/role picker. */
function fieldInput(guildId: string, categoryId: string, field: SettingField, t: Translator) {
  const label = t(`config.fields.${categoryId}.${field.id}.label`);
  const value = readField(guildId, field);
  const labelled = () =>
    new LabelBuilder()
      .setLabel(truncate(label, 45))
      .setDescription(truncate(fieldHint(field, t), 100));

  switch (field.type) {
    case 'toggle':
      return labelled().setCheckboxComponent(
        new CheckboxBuilder().setCustomId(field.id).setDefault(Boolean(value)),
      );
    case 'choice':
    case 'language': {
      const options =
        field.type === 'language' ? ['auto', ...LANGUAGES] : [...(field.options ?? [])];
      const optionLabel = (option: string) =>
        field.type === 'language'
          ? t(`config.languages.${option}`)
          : t(`config.choices.${field.id}.${option}`);
      return labelled().setRadioGroupComponent(
        new RadioGroupBuilder().setCustomId(field.id).addOptions(
          options.map((option) => ({
            label: truncate(optionLabel(option), 100),
            value: option,
            default: option === value,
          })),
        ),
      );
    }
    case 'channel':
    case 'channels': {
      const many = field.type === 'channels';
      const current = many ? (value as string[]) : value ? [String(value)] : [];
      const select = new ChannelSelectMenuBuilder()
        .setCustomId(field.id)
        .setChannelTypes(...TEXT_CHANNELS)
        .setRequired(false)
        .setMinValues(0)
        .setMaxValues(many ? (field.limit ?? 25) : 1);
      if (current.length) select.setDefaultChannels(...current);
      return labelled().setChannelSelectMenuComponent(select);
    }
    case 'roles': {
      const select = new RoleSelectMenuBuilder()
        .setCustomId(field.id)
        .setRequired(false)
        .setMinValues(0)
        .setMaxValues(field.limit ?? 25);
      const current = value as string[];
      if (current.length) select.setDefaultRoles(...current);
      return labelled().setRoleSelectMenuComponent(select);
    }
    case 'template':
      return textField(field.id, label, {
        description: fieldHint(field, t),
        value: inputValue(guildId, field),
        required: !field.optional,
        paragraph: true,
        max: field.limit ?? 500,
      });
    case 'url':
      return textField(field.id, label, {
        description: fieldHint(field, t),
        value: inputValue(guildId, field),
        required: !field.optional,
        max: field.limit ?? 400,
      });
    default:
      return textField(field.id, label, {
        description: fieldHint(field, t),
        value: inputValue(guildId, field),
        max: 20,
      });
  }
}

/** Value submitted for one field, read the way its input stores it. */
function submittedValue(fields: ModalSubmitFields, field: SettingField): unknown {
  switch (field.type) {
    case 'toggle':
      return fields.getCheckbox(field.id);
    case 'choice':
    case 'language':
      return fields.getRadioGroup(field.id) ?? undefined;
    case 'channel':
      return fields.getSelectedChannels(field.id)?.first()?.id ?? '';
    case 'channels':
      return [...(fields.getSelectedChannels(field.id)?.keys() ?? [])];
    case 'roles':
      return [...(fields.getSelectedRoles(field.id)?.keys() ?? [])];
    default:
      return fields.getTextInputValue(field.id);
  }
}

/**
 * Form to edit every value of a settings category (up to five fields). A
 * section showing several categories passes its own id so the form returns to it.
 */
export function valuesModal(
  guildId: string,
  categoryId: SettingCategoryId,
  t: Translator,
  sectionId: string = categoryId,
): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(actionId(sectionId, 'save', categoryId))
    .setTitle(
      truncate(
        t('config.modalTitle', { category: t(`config.categories.${categoryId}.label`) }),
        45,
      ),
    )
    .addLabelComponents(
      settingsForm
        .fieldsOf(categoryId)
        .slice(0, 5)
        .map((field) => fieldInput(guildId, categoryId, field, t)),
    );
}

/** Validates and stores the values form. Returns an error message or null. */
export function saveValues(
  guildId: string,
  categoryId: SettingCategoryId,
  fields: ModalSubmitFields,
  t: Translator,
): string | null {
  const byId = new Map(settingsForm.fieldsOf(categoryId).map((field) => [field.id, field]));
  const result = settingsForm.applyForm(guildId, categoryId, (id) =>
    byId.has(id) ? submittedValue(fields, byId.get(id)!) : undefined,
  );
  if (result.ok) return null;
  if (result.reason === 'rule') return t(result.messageKey);
  return t('config.invalid', {
    field: t(`config.fields.${categoryId}.${result.field.id}.label`),
    hint: fieldHint(result.field, t),
  });
}

export const editButton = (t: Translator, categoryId: string): ButtonBuilder =>
  button(categoryId, 'edit', t('config.edit'), emojis.edit, ButtonStyle.Primary);

/** Button of a section that edits one of several categories it shows. */
export const editCategoryButton = (
  t: Translator,
  sectionId: string,
  categoryId: SettingCategoryId,
  emoji: string,
): ButtonBuilder =>
  new ButtonBuilder()
    .setCustomId(actionId(sectionId, 'edit', categoryId))
    .setLabel(truncate(t(`config.categories.${categoryId}.label`), 80))
    .setEmoji(emoji)
    .setStyle(ButtonStyle.Secondary);

/** Compact "Label · value" lines, without explanations. */
export const compactLines = (
  guildId: string,
  categoryId: SettingCategoryId,
  t: Translator,
): string =>
  settingsForm
    .fieldsOf(categoryId)
    .map(
      (field) =>
        `${t(`config.fields.${categoryId}.${field.id}.label`)} · ${displayField(guildId, field, t)}`,
    )
    .join('\n');

export const resetButton = (
  t: Translator,
  categoryId: string,
  style = ButtonStyle.Secondary,
): ButtonBuilder => button(categoryId, 'reset', t('config.reset'), emojis.reset, style);
