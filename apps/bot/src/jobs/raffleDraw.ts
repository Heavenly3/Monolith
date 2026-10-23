import type { Client } from 'discord.js';
import { logger, raffle, formatNumber, type DrawResult } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { translatorFor } from '../framework/context.ts';
import { mention } from '../framework/mentions.ts';
import * as ui from '../ui/index.ts';
import { coins, emojis, ticket } from '../ui/index.ts';

const log = logger.child('raffle');

function announcement(t: Translator, result: DrawResult): ui.Card {
  const won = result.winners.length > 0;
  const card = new ui.Card(won ? 'raffle' : 'neutral')
    .header(
      ui.featureTitle(t, 'raffle', t('raffle.resultsTitle')),
      t('raffle.winning', { number: `**${ticket(result.winningNumber)}**` }),
    )
    .divider();

  if (won) {
    const winners = result.winners.map((id) => `<@${id}>`).join(', ');
    card.text(
      `${emojis.win} ${
        result.winners.length > 1
          ? t('raffle.winnerSplit', { winners, pot: coins(result.pot), share: coins(result.share) })
          : t('raffle.winnerSingle', { winners, pot: coins(result.pot) })
      }`,
    );
  } else {
    card.text(
      `${t('raffle.noWinner', { tickets: formatNumber(result.tickets), pot: coins(result.nextPot) })} ${emojis.logo}`,
    );
  }
  return card.footer(t('raffle.footer', { command: mention('lottery buy') }));
}

/** Draws every round whose time has come and announces it where it started. */
export async function drawRaffles(client: Client<true>): Promise<void> {
  for (const guildId of raffle.dueRounds()) {
    const result = raffle.draw(guildId);
    log.info(
      `Raffle in ${guildId}: ${result.winningNumber} — ${result.winners.length} winner(s), pot ${result.pot}.`,
    );
    if (!result.channelId) continue;

    try {
      const channel = await client.channels.fetch(result.channelId);
      if (!channel?.isSendable()) continue;
      // Announcements follow the server language (its preferred locale when automatic).
      const locale = 'guild' in channel ? channel.guild.preferredLocale : null;
      await channel.send(
        announcement(translatorFor(guildId, locale), result).toChannelMessage(result.winners),
      );
    } catch (error) {
      log.warn('Could not announce the raffle result:', (error as Error).message);
    }
  }
}
