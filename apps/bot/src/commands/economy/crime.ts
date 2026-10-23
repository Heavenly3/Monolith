import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { crime, pick } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'crime.cooldown',

  data: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Try something illegal for a bigger payout. You may get fined.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const result = crime.attempt(guildId, user);
    if (!result.ok) return interaction.reply(ui.cooldown(t, result.remainingMs, t('crime.action')));

    const amount = coins(result.amount);
    const story = result.success
      ? pick(t.list('crime.success')).replaceAll('{amount}', amount)
      : `${pick(t.list('crime.fail'))} ${t('crime.fined', { amount })}`;

    const card = new ui.Card(result.success ? 'rob' : 'danger')
      .header(
        result.success
          ? `${emojis.rob} ${t('crime.successTitle')}`
          : `${emojis.busted} ${t('crime.failTitle')}`,
        story,
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .stats([
        { name: `${emojis.wallet} ${t('common.wallet')}`, value: coins(result.wallet) },
        { name: `${emojis.cooldown} ${t('crime.next')}`, value: relativeTime(result.readyAt) },
      ]);
    return interaction.reply(card.toMessage());
  },
});
