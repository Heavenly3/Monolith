import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { ROB, rob } from '@spacebet/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'rob.cooldown',

  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription("Try to steal from another member's wallet. Risky!")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) =>
      option.setName('user').setDescription('Your victim').setRequired(true),
    ),

  async execute(interaction, { t, guildId }) {
    const thief = interaction.user;
    const target = interaction.options.getUser('user', true);
    if (target.bot) return interaction.reply(ui.error(t('rob.bot')));

    const result = rob.attempt(guildId, thief, target);
    if (!result.ok) {
      switch (result.reason) {
        case 'self':
          return interaction.reply(ui.error(t('rob.self')));
        case 'cooldown':
          return interaction.reply(ui.cooldown(t, result.remainingMs, t('rob.action')));
        case 'thiefPoor':
          return interaction.reply(
            ui.error(t('rob.thiefPoor', { amount: coins(ROB.minThiefWallet) })),
          );
        case 'targetPoor':
          return interaction.reply(ui.error(t('rob.targetPoor', { target })));
      }
    }

    const vars = { target, amount: coins(result.amount) };
    const card = new ui.Card(result.success ? 'rob' : 'danger')
      .header(
        result.success
          ? `${emojis.rob} ${t('rob.successTitle')}`
          : `${emojis.busted} ${t('rob.failTitle')}`,
        result.success ? t('rob.successBody', vars) : t('rob.failBody', vars),
        thief.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .stats([
        { name: `${emojis.wallet} ${t('common.yourWallet')}`, value: coins(result.wallet) },
        { name: `${emojis.cooldown} ${t('rob.next')}`, value: relativeTime(result.readyAt) },
      ])
      .footer(t('features.rob'));

    const message = card.toMessage();
    message.allowedMentions = { users: [target.id] };
    return interaction.reply(message);
  },
});
