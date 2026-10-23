import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, cooldowns, pick, randomBetween, settings, work } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'work.cooldown',

  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work a quest and earn gold.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const remaining = cooldowns.remaining(guildId, user.id, 'work');
    if (remaining) return interaction.reply(ui.cooldown(t, remaining, t('work.action')));

    const messages = work.getMessages(guildId, t.list('work.defaultMessages'));
    if (messages.length === 0) {
      return interaction.reply(ui.warning(t('work.noJobs', { command: mention('config') })));
    }

    const { min, max } = settings.get(guildId, 'work.range');
    const earnings = randomBetween(min, max);
    accounts.getAccount(guildId, user);
    accounts.credit(guildId, user.id, earnings, 'work');
    const readyAt = cooldowns.startConfigured(guildId, user.id, 'work');

    const template = pick(messages);
    const story = template.includes('{amount}')
      ? template.replaceAll('{amount}', coins(earnings))
      : t('work.fallback', { message: template, amount: coins(earnings) });

    const card = new ui.Card('work')
      .header(`${emojis.work} ${t('work.title')}`, story, user.displayAvatarURL({ size: 128 }))
      .divider()
      .stats([
        {
          name: `${emojis.wallet} ${t('common.wallet')}`,
          value: coins(accounts.findAccount(guildId, user.id)!.wallet),
        },
        { name: `${emojis.cooldown} ${t('work.next')}`, value: relativeTime(readyAt) },
      ])
      .footer(t('features.work'));

    return interaction.reply(card.toMessage());
  },
});
