import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { MODULES, settings, type ModuleId } from '@monolith/core';
import { emojis, type EmojiName } from '../../../ui/index.ts';
import { actionId } from '../shared.ts';
import type { Section } from '../types.ts';

const MODULE_ICONS: Record<ModuleId, EmojiName> = {
  economy: 'money',
  games: 'slots',
  shop: 'shop',
  loans: 'loan',
  lottery: 'raffle',
  levels: 'level',
};

const isModule = (value: string | undefined): value is ModuleId =>
  (MODULES as readonly string[]).includes(value ?? '');

/** One button per module: green when on, grey when off. Pressing it switches. */
export const modulesSection: Section = {
  icon: 'modules',
  color: 'config',

  render(t, { guildId }) {
    const lines = MODULES.map((module) => {
      const on = settings.get(guildId, `modules.${module}`);
      return `${emojis[MODULE_ICONS[module]]} **${t(`modules.${module}`)}** · ${
        on ? `${emojis.success} ${t('config.on')}` : `${emojis.error} ${t('config.off')}`
      }\n-# ${t(`config.fields.modules.${module}.help`)}`;
    });
    const buttons = MODULES.map((module) =>
      new ButtonBuilder()
        .setCustomId(actionId('modules', 'toggle', module))
        .setLabel(t(`modules.${module}`))
        .setEmoji(emojis[MODULE_ICONS[module]])
        .setStyle(
          settings.get(guildId, `modules.${module}`) ? ButtonStyle.Success : ButtonStyle.Secondary,
        ),
    );
    return {
      blocks: [lines.join('\n'), `-# ${t('panel.modules.hint')}`],
      rows: [buttons.slice(0, 3), buttons.slice(3)],
    };
  },

  actions: {
    toggle({ t, guildId, args: [module] }) {
      if (!isModule(module)) return { error: t('config.unknown') };
      const on = !settings.get(guildId, `modules.${module}`);
      settings.set(guildId, `modules.${module}`, on);
      return {
        banner: `${on ? emojis.success : emojis.error} ${t(on ? 'panel.modules.enabled' : 'panel.modules.disabled', { module: t(`modules.${module}`) })}`,
      };
    },
  },
};
