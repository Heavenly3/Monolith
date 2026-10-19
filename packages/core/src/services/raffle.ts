import { many, one, run, transaction } from '../db/database.ts';
import * as accounts from './accounts.ts';
import * as settings from './settings.ts';
import { randomBetween } from '../utils/random.ts';
import { RAFFLE } from '../config/games.ts';
import type { RaffleRound } from '../types.ts';

interface RoundRow {
  guild_id: string;
  pot: number;
  draw_at: number | null;
  channel_id: string | null;
}

const toRound = (row: RoundRow): RaffleRound => ({
  guildId: row.guild_id,
  pot: row.pot,
  drawAt: row.draw_at,
  channelId: row.channel_id,
});

/** Current round of a server (created with the starting pot on first use). */
export function getRound(guildId: string): RaffleRound {
  run(
    'INSERT INTO raffle_rounds (guild_id, pot) VALUES (?, ?) ON CONFLICT DO NOTHING',
    guildId,
    settings.get(guildId, 'raffle.basePot'),
  );
  return toRound(one<RoundRow>('SELECT * FROM raffle_rounds WHERE guild_id = ?', guildId)!);
}

export function ticketCount(guildId: string): number {
  return one<{ total: number }>(
    'SELECT COUNT(*) AS total FROM raffle_tickets WHERE guild_id = ?',
    guildId,
  )!.total;
}

export function ticketsOf(guildId: string, userId: string): number[] {
  return many<{ number: number }>(
    'SELECT number FROM raffle_tickets WHERE guild_id = ? AND user_id = ? ORDER BY number',
    guildId,
    userId,
  ).map((row) => row.number);
}

export type TicketPurchase =
  | { ok: true; price: number; round: RaffleRound }
  | { ok: false; reason: 'duplicate' | 'funds' | 'range'; price: number };

/** Buys a ticket. The first ticket of a round schedules the draw. */
export function buyTicket(
  guildId: string,
  userId: string,
  number: number,
  channelId: string,
): TicketPurchase {
  const price = settings.get(guildId, 'raffle.ticketPrice');
  if (!Number.isInteger(number) || number < 0 || number > RAFFLE.maxNumber) {
    return { ok: false, reason: 'range', price };
  }

  return transaction((): TicketPurchase => {
    const owned = one(
      'SELECT 1 FROM raffle_tickets WHERE guild_id = ? AND user_id = ? AND number = ?',
      guildId,
      userId,
      number,
    );
    if (owned) return { ok: false, reason: 'duplicate', price };
    if (!accounts.debit(guildId, userId, price, 'raffle_ticket'))
      return { ok: false, reason: 'funds', price };

    const round = getRound(guildId);
    run(
      'INSERT INTO raffle_tickets (guild_id, user_id, number, created_at) VALUES (?, ?, ?, ?)',
      guildId,
      userId,
      number,
      Date.now(),
    );
    const drawAt = round.drawAt ?? Date.now() + settings.get(guildId, 'raffle.drawDelay') * 1000;
    run(
      `UPDATE raffle_rounds SET pot = pot + ?, draw_at = ?, channel_id = COALESCE(channel_id, ?)
       WHERE guild_id = ?`,
      price,
      drawAt,
      channelId,
      guildId,
    );
    return { ok: true, price, round: getRound(guildId) };
  });
}

/** Servers whose draw time has passed. */
export function dueRounds(now = Date.now()): string[] {
  return many<{ guild_id: string }>(
    'SELECT guild_id FROM raffle_rounds WHERE draw_at IS NOT NULL AND draw_at <= ?',
    now,
  ).map((row) => row.guild_id);
}

export interface DrawResult {
  guildId: string;
  winningNumber: number;
  winners: string[];
  share: number;
  pot: number;
  nextPot: number;
  tickets: number;
  channelId: string | null;
}

/**
 * Draws the winning number. Holders of that number split the pot; if nobody
 * holds it the pot rolls over to the next round.
 */
export function draw(
  guildId: string,
  winningNumber = randomBetween(0, RAFFLE.maxNumber),
): DrawResult {
  return transaction(() => {
    const round = getRound(guildId);
    const winners = many<{ user_id: string }>(
      'SELECT user_id FROM raffle_tickets WHERE guild_id = ? AND number = ?',
      guildId,
      winningNumber,
    ).map((row) => row.user_id);
    const tickets = ticketCount(guildId);

    const share = winners.length ? Math.floor(round.pot / winners.length) : 0;
    for (const userId of winners) accounts.credit(guildId, userId, share, 'raffle_win');

    const nextPot = winners.length ? settings.get(guildId, 'raffle.basePot') : round.pot;
    run('DELETE FROM raffle_tickets WHERE guild_id = ?', guildId);
    run(
      'UPDATE raffle_rounds SET pot = ?, draw_at = NULL, channel_id = NULL WHERE guild_id = ?',
      nextPot,
      guildId,
    );

    return {
      guildId,
      winningNumber,
      winners,
      share,
      pot: round.pot,
      nextPot,
      tickets,
      channelId: round.channelId,
    };
  });
}
