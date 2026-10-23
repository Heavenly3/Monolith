import { LabelBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from 'discord.js';
import { accounts, formatNumber, parseWholeNumber, type Balance } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { coins, emojis } from '../../../ui/index.ts';
import { ButtonStyle, button, modal, textField } from '../shared.ts';
import type { Section } from '../types.ts';

const medals = (): string[] => [emojis.first, emojis.second, emojis.third];

function adjustModal(t: Translator) {
  const select = (id: string, required: boolean) =>
    new StringSelectMenuBuilder().setCustomId(id).setRequired(required);

  return modal('members', 'save', t('panel.members.modalTitle')).addLabelComponents(
    new LabelBuilder()
      .setLabel(t('panel.members.member'))
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder().setCustomId('user').setRequired(true),
      ),
    new LabelBuilder().setLabel(t('panel.members.action')).setStringSelectMenuComponent(
      select('action', true).addOptions(
        accounts.MONEY_ACTIONS.map((value) => ({
          label: t(`panel.members.actions.${value}`),
          value,
          default: value === 'add',
        })),
      ),
    ),
    new LabelBuilder().setLabel(t('panel.members.account')).setStringSelectMenuComponent(
      select('account', false).addOptions(
        (['wallet', 'bank'] as const).map((value) => ({
          label: t(`common.${value}`),
          emoji: emojis[value],
          value,
          default: value === 'wallet',
        })),
      ),
    ),
    textField('amount', t('panel.members.amount'), {
      description: t('panel.members.amountHint'),
      required: false,
      max: 15,
    }),
  );
}

export const members: Section = {
  icon: 'netWorth',
  color: 'economy',

  render(t, { guildId }) {
    const stats = accounts.stats(guildId);
    const top = accounts
      .leaderboard(guildId, 3)
      .map((row, i) => `${medals()[i]} <@${row.userId}> · ${coins(row.netWorth)}`);
    return {
      blocks: [
        [
          `**${t('panel.members.accounts')}** · ${formatNumber(stats.accounts)}`,
          `**${emojis.wallet} ${t('panel.members.inWallets')}** · ${coins(stats.wallets)}`,
          `**${emojis.bank} ${t('panel.members.inBanks')}** · ${coins(stats.banks)}`,
        ].join('\n'),
        top.length > 0 && `### ${emojis.rank} ${t('features.leaderboard')}\n${top.join('\n')}`,
        `-# ${t('panel.members.hint')}`,
      ],
      rows: [
        [button('members', 'adjust', t('panel.members.adjust'), emojis.money, ButtonStyle.Primary)],
      ],
    };
  },

  actions: {
    adjust: ({ t }) => ({ modal: adjustModal(t) }),

    save({ t, guildId, fields }) {
      if (!fields) return { error: t('config.unknown') };
      const user = fields.getSelectedUsers('user', true).first()!;
      const action = (fields.getStringSelectValues('action')[0] ?? 'add') as accounts.MoneyAction;
      const account = (fields.getStringSelectValues('account')[0] ?? 'wallet') as Balance;
      const amount = parseWholeNumber(fields.getTextInputValue('amount'));

      if (user.bot) return { error: t('common.botsNoAccount') };
      if (action !== 'reset' && (amount === null || (action !== 'set' && amount === 0))) {
        return { error: t('panel.members.amountRequired') };
      }

      const {
        before,
        after,
        amount: moved,
      } = accounts.adjust(guildId, user, action, account, amount ?? 0);
      const vars = { user, account: t(`moneyAdmin.accounts.${account}`), amount: coins(moved) };
      const summary = t(`moneyAdmin.${action}`, vars);

      return {
        banner: [
          `${emojis.success} ${summary}`,
          `-# ${emojis.wallet} ${coins(before.wallet)} → ${coins(after.wallet)} · ${emojis.bank} ${coins(before.bank)} → ${coins(after.bank)}`,
        ].join('\n'),
      };
    },
  },
};
