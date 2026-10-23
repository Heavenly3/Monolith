import { accounts, formatNumber, loans } from '@monolith/core';
import { coins, emojis, relativeTime } from '../../../ui/index.ts';
import {
  ButtonStyle,
  button,
  categoryLines,
  editButton,
  list,
  picker,
  resetButton,
} from '../shared.ts';
import { confirmed, type Section } from '../types.ts';

export const loansSection: Section = {
  icon: 'loan',
  color: 'loans',

  render(t, { guildId }) {
    const active = loans.listLoans(guildId);
    const name = (userId: string): string => accounts.getProfile(userId)?.username ?? userId;
    return {
      blocks: [
        categoryLines(guildId, 'loans', t),
        `### ${emojis.bill} ${t('loansAdmin.listTitle')} (${active.length})\n${
          active.length
            ? list(
                active.map(
                  (loan) =>
                    `<@${loan.userId}> · ${coins(loan.amountDue)} · ${t('loansAdmin.due', { time: relativeTime(loan.dueAt) })}`,
                ),
                t,
                10,
              )
            : `${emojis.sector} ${t('loansAdmin.empty')}`
        }`,
      ],
      rows: [
        [
          editButton(t, 'loans'),
          resetButton(t, 'loans'),
          button('loans', 'cancelAll', t('panel.loans.cancelAll'), emojis.card, ButtonStyle.Danger),
        ],
        [
          picker(
            'loans',
            'cancel',
            t('panel.loans.cancelPlaceholder'),
            active.map((loan) => ({
              label: name(loan.userId),
              description: formatNumber(loan.amountDue),
              emoji: emojis.loan,
              value: loan.userId,
            })),
          ),
        ],
      ],
    };
  },

  actions: {
    cancel({ t, guildId, value = '' }) {
      return {
        banner: loans.cancel(guildId, value)
          ? `${emojis.success} ${t('loansAdmin.cancelled', { user: `<@${value}>` })}`
          : `${emojis.warning} ${t('loansAdmin.none', { user: `<@${value}>` })}`,
      };
    },

    cancelAll({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'cancelAll' },
          banner: `${emojis.warning} ${t('panel.loans.confirmCancelAll')}`,
        };
      }
      return {
        banner: `${emojis.success} ${t('loansAdmin.cancelledAll', { count: loans.cancelAll(guildId) })}`,
      };
    },
  },
};
