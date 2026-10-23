import { StringSelectMenuBuilder } from 'discord.js';
import { parseFieldValue, settings, settingsForm, type SettingValues } from '@monolith/core';
import { LANGUAGES, translator, type Translator } from '@monolith/i18n';
import { emojis } from '../../../ui/index.ts';
import { ButtonStyle, actionId, categoryLines, resetButton } from '../shared.ts';
import type { Section } from '../types.ts';

const languageField = settingsForm.fieldsOf('general')[0]!;

function languageMenu(t: Translator, guildId: string): StringSelectMenuBuilder {
  const current = settings.get(guildId, 'general.language');
  return new StringSelectMenuBuilder()
    .setCustomId(actionId('general', 'language'))
    .setPlaceholder(t('config.languagePlaceholder'))
    .addOptions(
      (['auto', ...LANGUAGES] as const).map((value) => ({
        label: t(`config.languages.${value}`),
        description: value === 'auto' ? t('config.languages.autoDescription') : undefined,
        emoji: value === 'auto' ? emojis.sector : translator(value)('meta.flag'),
        value,
        default: value === current,
      })),
    );
}

export const general: Section = {
  icon: 'config',
  color: 'config',

  render: (t, { guildId }) => ({
    blocks: [categoryLines(guildId, 'general', t)],
    rows: [[languageMenu(t, guildId)], [resetButton(t, 'general', ButtonStyle.Danger)]],
  }),

  actions: {
    // The panel is rebuilt in the new language right away.
    language({ guildId, value }) {
      const language = parseFieldValue(languageField, value ?? '') as
        SettingValues['general.language'] | undefined;
      settings.set(guildId, 'general.language', language ?? 'auto');
      return { refresh: true, banner: (t) => `${emojis.success} ${t('config.languageSaved')}` };
    },

    reset({ guildId }) {
      settingsForm.resetCategory(guildId, 'general');
      return { refresh: true, banner: (t) => `${emojis.reset} ${t('config.restored')}` };
    },
  },
};
