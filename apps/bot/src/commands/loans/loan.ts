import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { accounts, formatDuration, loans, parseAmount, settings, type Loan } from '@spacebet/core';
import type { Translator } from '@spacebet/i18n';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, fullTime, relativeTime } from '../../ui/index.ts';

function statusCard(t: Translator, loan: Loan, wallet: number): ui.Card {
  const dueSoon = loan.dueAt - Date.now() < 60 * 60 * 1000;
  const canRepay = wallet >= loan.amountDue;
  return new ui.Card(dueSoon ? 'warning' : 'loans')
    .header(`${emojis.loan} ${t('loans.statusTitle')}`, t('loans.statusSubtitle'))
    .divider()
    .fields([
      { name: `${emojis.money} ${t('loans.borrowed')}`, value: coins(loan.principal) },
      { name: `${emojis.interest} ${t('loans.interest')}`, value: `${loan.interestRate}%` },
      { name: `${emojis.bill} ${t('loans.amountDue')}`, value: coins(loan.amountDue) },
      {
        name: `${emojis.due} ${t('loans.due')}`,
        value: `${fullTime(loan.dueAt)} (${relativeTime(loan.dueAt)})`,
      },
    ])
    .actions([
      new ButtonBuilder()
        .setCustomId(`loan:repay:${loan.userId}`)
        .setLabel(t('loans.repayButton'))
        .setEmoji(emojis.card)
        .setStyle(ButtonStyle.Success)
        .setDisabled(!canRepay),
    ])
    .footer(canRepay ? t('features.loans') : t('loans.cannotRepayYet'));
}

function repay(
  t: Translator,
  guildId: string,
  userId: string,
): { ok: true; card: ui.Card } | { ok: false; message: ui.CardMessage } {
  const result = loans.repay(guildId, userId);
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === 'none'
          ? ui.info(t('loans.noLoan'))
          : ui.error(t('loans.needToRepay', { amount: coins(result.loan.amountDue) })),
    };
  }
  const card = new ui.Card('success')
    .header(
      `${emojis.success} ${t('loans.repaidTitle')}`,
      t('loans.repaidBody', { amount: coins(result.loan.amountDue) }),
    )
    .divider()
    .stats([
      {
        name: `${emojis.wallet} ${t('common.wallet')}`,
        value: coins(accounts.findAccount(guildId, userId)!.wallet),
      },
    ])
    .footer(t('features.loans'));
  return { ok: true, card };
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('loan')
    .setDescription('Borrow coins from the Stellar Bank.')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName('request')
        .setDescription('Request a new loan.')
        .addStringOption((option) =>
          option
            .setName('amount')
            .setDescription('How much to borrow — e.g. 5000 or 10k')
            .setRequired(true)
            .setMaxLength(20),
        ),
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Check your active loan.'))
    .addSubcommand((sub) => sub.setName('repay').setDescription('Repay your loan in full.')),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const account = accounts.getAccount(guildId, user);

    switch (interaction.options.getSubcommand()) {
      case 'status': {
        const loan = loans.getLoan(guildId, user.id);
        if (!loan) {
          return interaction.reply(
            ui.info(
              t('loans.none', {
                max: coins(settings.get(guildId, 'loan.maxAmount')),
                rate: settings.get(guildId, 'loan.interestRate'),
              }),
            ),
          );
        }
        return interaction.reply(
          statusCard(t, loan, account.wallet).toMessage({ ephemeral: true }),
        );
      }

      case 'repay': {
        const result = repay(t, guildId, user.id);
        return interaction.reply(result.ok ? result.card.toMessage() : result.message);
      }

      default: {
        const max = settings.get(guildId, 'loan.maxAmount');
        const amount = parseAmount(interaction.options.getString('amount', true), max);
        const request = loans.requestLoan(guildId, user.id, amount);
        if (!request.ok) {
          const errors = {
            active: t('loans.already', { command: mention('loan repay') }),
            negative: t('loans.negative'),
            range: t('loans.range', { max: coins(request.max) }),
          };
          return interaction.reply(ui.error(errors[request.reason]));
        }

        const { loan } = request;
        const card = new ui.Card('loans')
          .header(
            `${emojis.success} ${t('loans.approvedTitle')}`,
            t('loans.approvedBody', { amount: coins(loan.principal) }),
            user.displayAvatarURL({ size: 128 }),
          )
          .divider()
          .fields([
            { name: `${emojis.interest} ${t('loans.interest')}`, value: `${loan.interestRate}%` },
            { name: `${emojis.bill} ${t('loans.amountDue')}`, value: coins(loan.amountDue) },
            {
              name: `${emojis.due} ${t('loans.due')}`,
              value: t('loans.term', {
                time: relativeTime(loan.dueAt),
                duration: formatDuration(settings.get(guildId, 'loan.duration')),
              }),
            },
          ])
          .footer(t('loans.footer'));
        return interaction.reply(card.toMessage());
      }
    }
  },

  components: {
    async repay(interaction, [ownerId = ''], { t, guildId }) {
      if (interaction.user.id !== ownerId) return interaction.reply(ui.error(t('loans.notYours')));
      const result = repay(t, guildId, ownerId);
      if (!result.ok) return interaction.reply(result.message);
      // On success the status panel is replaced by the receipt.
      if (interaction.isButton()) return interaction.update(result.card.toEdit());
      return interaction.reply(result.card.toMessage());
    },
  },
});
