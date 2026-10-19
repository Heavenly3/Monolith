// Shared implementation of /deposit and /withdraw. Files starting with "_"
// are helpers, not commands: the loader only loads files with a default export.
import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, parseAmount, type Balance } from '@mythcore/core';
import { defineCommand, type CommandDefinition } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

export function bankCommand(name: 'deposit' | 'withdraw', description: string): CommandDefinition {
  const from: Balance = name === 'deposit' ? 'wallet' : 'bank';

  return defineCommand({
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .setContexts(InteractionContextType.Guild)
      .addStringOption((option) =>
        option
          .setName('amount')
          .setDescription('Amount — e.g. 500, 2.5k, half or all')
          .setRequired(true)
          .setMaxLength(20),
      ),

    async execute(interaction, { t, guildId }) {
      const account = accounts.getAccount(guildId, interaction.user);
      const available = account[from];
      const amount = parseAmount(interaction.options.getString('amount', true), available);

      if (amount === null) {
        const empty = from === 'wallet' ? 'common.emptyWallet' : 'common.emptyBank';
        return interaction.reply(ui.error(available > 0 ? t('common.invalidAmount') : t(empty)));
      }
      if (!accounts.move(guildId, interaction.user.id, from, amount)) {
        const short = from === 'wallet' ? 'common.notEnoughWallet' : 'common.notEnoughBank';
        return interaction.reply(ui.error(t(short, { amount: coins(available) })));
      }

      const updated = accounts.findAccount(guildId, interaction.user.id)!;
      const card = new ui.Card('bank')
        .header(
          `${emojis[name]} ${t(`bank.${name}Title`)}`,
          t(`bank.${name}Body`, { amount: coins(amount) }),
        )
        .divider()
        .stats([
          { name: `${emojis.wallet} ${t('common.wallet')}`, value: coins(updated.wallet) },
          { name: `${emojis.bank} ${t('common.bank')}`, value: coins(updated.bank) },
        ])
        .footer(t('features.bank'));

      return interaction.reply(card.toMessage());
    },
  });
}
