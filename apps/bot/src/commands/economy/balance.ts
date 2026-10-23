import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, loans } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription("See your credits (wallet and bank) or another member's.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Member to check')),

  async execute(interaction, { t, guildId }) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    if (target.bot) return interaction.reply(ui.info(`${emojis.bot} ${t('common.botsNoAccount')}`));

    const account = accounts.getAccount(guildId, target);
    const rank = accounts.rankOf(guildId, target.id);
    const loan = loans.getLoan(guildId, target.id);

    const subtitle = [t('balance.subtitle', { user: target }), rank && t('balance.rank', { rank })]
      .filter(Boolean)
      .join(' · ');

    const card = new ui.Card(account.wallet < 0 ? 'danger' : 'economy')
      .header(ui.featureTitle(t, 'balance'), subtitle, target.displayAvatarURL({ size: 128 }))
      .divider()
      .fields([
        { name: `${emojis.wallet} ${t('common.wallet')}`, value: coins(account.wallet) },
        { name: `${emojis.bank} ${t('common.bank')}`, value: coins(account.bank) },
        {
          name: `${emojis.netWorth} ${t('common.netWorth')}`,
          value: coins(account.wallet + account.bank),
        },
        loan && {
          name: `${emojis.loan} ${t('balance.activeLoan')}`,
          value: t('balance.loanDue', {
            amount: coins(loan.amountDue),
            time: relativeTime(loan.dueAt),
          }),
        },
      ])
      .footer();

    return interaction.reply(card.toMessage());
  },
});
