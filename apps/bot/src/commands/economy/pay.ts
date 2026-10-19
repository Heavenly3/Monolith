import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, parseAmount } from '@mythcore/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Give gold from your wallet to another member.')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) =>
      option.setName('user').setDescription('Who receives the gold').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('amount')
        .setDescription('Amount — e.g. 500, 2.5k, half or all')
        .setRequired(true)
        .setMaxLength(20),
    ),

  async execute(interaction, { t, guildId }) {
    const target = interaction.options.getUser('user', true);
    if (target.id === interaction.user.id) return interaction.reply(ui.error(t('pay.self')));
    if (target.bot) return interaction.reply(ui.error(t('pay.bot')));

    const sender = accounts.getAccount(guildId, interaction.user);
    accounts.getAccount(guildId, target);
    const amount = parseAmount(interaction.options.getString('amount', true), sender.wallet);

    if (amount === null) return interaction.reply(ui.error(t('common.invalidAmount')));
    if (!accounts.transfer(guildId, interaction.user.id, target.id, amount)) {
      return interaction.reply(
        ui.error(t('common.notEnoughWallet', { amount: coins(sender.wallet) })),
      );
    }

    const card = new ui.Card('economy')
      .header(
        `${emojis.payment} ${t('pay.title')}`,
        t('pay.body', { sender: interaction.user, amount: coins(amount), target }),
      )
      .divider()
      .stats([
        {
          name: `${emojis.wallet} ${t('common.yourWallet')}`,
          value: coins(accounts.findAccount(guildId, interaction.user.id)!.wallet),
        },
      ])
      .footer(t('features.bank'));

    const message = card.toMessage();
    message.allowedMentions = { users: [target.id] };
    return interaction.reply(message);
  },
});
