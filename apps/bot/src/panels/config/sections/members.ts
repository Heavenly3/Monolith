import { LabelBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder } from 'discord.js';
import { accounts, formatNumber, parseWholeNumber, type Balance } from '@spacebet/core';
import type { Translator } from '@spacebet/i18n';
import { coins, emojis } from '../../../ui/index.ts';
import { ButtonStyle, button, modal, textField } from '../shared.ts';
import type { Section } from '../types.ts';

const ACTIONS = ['add', 'remove', 'set', 'reset'] as const;
type MoneyAction = (typeof ACTIONS)[number];
const MEDALS = [emojis.first, emojis.second, emojis.third];

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
        ACTIONS.map((value) => ({
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
      .map((row, i) => `${MEDALS[i]} <@${row.userId}> · ${coins(row.netWorth)}`);
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
      const action = (fields.getStringSelectValues('action')[0] ?? 'add') as MoneyAction;
      const account = (fields.getStringSelectValues('account')[0] ?? 'wallet') as Balance;
      const amount = parseWholeNumber(fields.getTextInputValue('amount'));

      if (user.bot) return { error: t('common.botsNoAccount') };
      if (action !== 'reset' && (amount === null || (action !== 'set' && amount === 0))) {
        return { error: t('panel.members.amountRequired') };
      }

      const before = accounts.getAccount(guildId, user);
      const vars = { user, account: t(`moneyAdmin.accounts.${account}`) };
      let summary: string;
      switch (action) {
        case 'add':
          accounts.credit(guildId, user.id, amount!, 'admin', account);
          summary = t('moneyAdmin.add', { ...vars, amount: coins(amount!) });
          break;
        case 'remove':
          summary = t('moneyAdmin.remove', {
            ...vars,
            amount: coins(accounts.debitUpTo(guildId, user.id, amount!, 'admin', account)),
          });
          break;
        case 'set':
          accounts.setBalance(guildId, user.id, account, amount!);
          summary = t('moneyAdmin.set', { ...vars, amount: coins(amount!) });
          break;
        case 'reset':
          accounts.setBalance(guildId, user.id, 'wallet', 0);
          accounts.setBalance(guildId, user.id, 'bank', 0);
          summary = t('moneyAdmin.reset', vars);
          break;
      }

      const after = accounts.findAccount(guildId, user.id)!;
      return {
        banner: [
          `${emojis.success} ${summary}`,
          `-# ${emojis.wallet} ${coins(before.wallet)} → ${coins(after.wallet)} · ${emojis.bank} ${coins(before.bank)} → ${coins(after.bank)}`,
        ].join('\n'),
      };
    },
  },
};
