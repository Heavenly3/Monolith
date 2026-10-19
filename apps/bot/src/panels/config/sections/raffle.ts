import { formatNumber, raffle } from '@mythcore/core';
import { coins, emojis, relativeTime } from '../../../ui/index.ts';
import { categoryLines, editButton, resetButton } from '../shared.ts';
import type { Section } from '../types.ts';

export const raffleSection: Section = {
  icon: 'raffle',
  color: 'raffle',

  render(t, { guildId }) {
    const round = raffle.getRound(guildId);
    return {
      blocks: [
        categoryLines(guildId, 'raffle', t),
        [
          `### ${emojis.ticket} ${t('panel.raffle.round')}`,
          `${emojis.money} ${t('raffle.pot')} · ${coins(round.pot)}`,
          `${emojis.bill} ${t('raffle.sold')} · ${formatNumber(raffle.ticketCount(guildId))}`,
          `${emojis.clock} ${t('raffle.draw')} · ${round.drawAt ? relativeTime(round.drawAt) : t('panel.raffle.waiting')}`,
        ].join('\n'),
      ],
      rows: [[editButton(t, 'raffle'), resetButton(t, 'raffle')]],
    };
  },
};
