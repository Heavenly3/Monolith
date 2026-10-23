import { accounts, formatNumber } from '@monolith/core';
import { emojis } from '../../../ui/index.ts';
import { ButtonStyle, button, compactLines, editCategoryButton } from '../shared.ts';
import { confirmed, type Section } from '../types.ts';

const CATEGORIES = [
  ['economy', 'bank'],
  ['robbery', 'rob'],
  ['crime', 'busted'],
  ['crimeFine', 'bill'],
  ['chatMoney', 'message'],
] as const;

// Rules of the whole economy: starting and maximum balance, bet limits and
// robbing, crime and chat credits, plus wiping every balance.
export const economySection: Section = {
  icon: 'bank',
  color: 'brand',

  render(t, { guildId }) {
    const stats = accounts.stats(guildId);
    return {
      blocks: [
        `${emojis.netWorth} ${t('panel.economy.stats', {
          accounts: formatNumber(stats.accounts),
          total: formatNumber(stats.wallets + stats.banks),
        })}`,
        CATEGORIES.map(
          ([category, icon]) =>
            `### ${emojis[icon]} ${t(`config.categories.${category}.label`)}\n${compactLines(guildId, category, t)}`,
        ).join('\n'),
      ],
      rows: [
        CATEGORIES.map(([category, icon]) =>
          editCategoryButton(t, 'economy', category, emojis[icon]),
        ),
        [
          button(
            'economy',
            'resetAll',
            t('panel.economy.resetAll'),
            emojis.reset,
            ButtonStyle.Danger,
          ),
        ],
      ],
    };
  },

  actions: {
    resetAll({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'resetAll' },
          banner: `${emojis.warning} ${t('panel.economy.confirmResetAll')}`,
        };
      }
      const count = accounts.resetAll(guildId);
      return { banner: `${emojis.reset} ${t('panel.economy.resetDone', { count })}` };
    },
  },
};
