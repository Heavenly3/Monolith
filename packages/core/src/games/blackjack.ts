// Blackjack against the house. A hand lives in the database between button
// presses, so it cannot be paid twice and survives a restart; hands left
// alone are stood automatically (see expire).
import { many, one, run, transaction } from '../db/database.ts';
import * as accounts from '../services/accounts.ts';
import type { UserRef } from '../types.ts';
import { shuffle } from '../utils/random.ts';
import * as bets from './bets.ts';
import type { BetResult, Settlement } from './bets.ts';

export const SUITS = ['S', 'H', 'D', 'C'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
/** A card is rank + suit, e.g. "10H" or "AS". */
export type Card = `${(typeof RANKS)[number]}${(typeof SUITS)[number]}`;

const DECKS = 4;
/** Hands untouched for this long are stood for the player. */
export const IDLE_MS = 5 * 60_000;

export const PAYOUTS = { blackjack: 2.5, win: 2, push: 1, lose: 0 } as const;
export type Outcome = keyof typeof PAYOUTS | 'bust';

export interface Hand {
  userId: string;
  stake: number;
  player: Card[];
  dealer: Card[];
  doubled: boolean;
  /** Whether the player may still double (only as the first move). */
  canDouble: boolean;
}

export interface Finished extends Omit<Hand, 'canDouble'> {
  outcome: Outcome;
  settlement: Settlement;
}

export type Move = 'hit' | 'stand' | 'double';

export type PlayResult =
  | { ok: true; state: 'playing'; hand: Hand }
  | { ok: true; state: 'done'; hand: Finished }
  | { ok: false; reason: 'none' | 'funds' | 'cannotDouble' };

export function freshDeck(): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < DECKS; d++) {
    for (const suit of SUITS) for (const rank of RANKS) cards.push(`${rank}${suit}`);
  }
  return shuffle(cards);
}

const rankOf = (card: Card): string => card.slice(0, -1);

/** Best total of a hand: aces count 11 unless that busts. */
export function total(cards: readonly Card[]): number {
  let sum = 0;
  let aces = 0;
  for (const card of cards) {
    const rank = rankOf(card);
    if (rank === 'A') {
      aces++;
      sum += 11;
    } else sum += ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank);
  }
  while (sum > 21 && aces-- > 0) sum -= 10;
  return sum;
}

export const isBlackjack = (cards: readonly Card[]): boolean =>
  cards.length === 2 && total(cards) === 21;

/** The dealer draws to 17 and stands on every 17, soft or hard. */
function dealerPlays(dealer: Card[], deck: Card[]): void {
  while (total(dealer) < 17) dealer.push(deck.pop()!);
}

function outcomeOf(player: Card[], dealer: Card[]): Outcome {
  const mine = total(player);
  if (mine > 21) return 'bust';
  if (isBlackjack(player) && !isBlackjack(dealer)) return 'blackjack';
  const theirs = total(dealer);
  if (theirs > 21 || mine > theirs) return 'win';
  return mine === theirs ? 'push' : 'lose';
}

interface Row {
  user_id: string;
  stake: number;
  deck: string;
  player: string;
  dealer: string;
  doubled: number;
}

const load = (guildId: string, userId: string): Row | undefined =>
  one<Row>('SELECT * FROM blackjack_games WHERE guild_id = ? AND user_id = ?', guildId, userId);

const handOf = (row: Row): Hand => {
  const player = JSON.parse(row.player) as Card[];
  return {
    userId: row.user_id,
    stake: row.stake,
    player,
    dealer: JSON.parse(row.dealer) as Card[],
    doubled: row.doubled === 1,
    canDouble: player.length === 2 && row.doubled === 0,
  };
};

/** Ends a hand: the dealer plays (unless the player bust), then the bet is paid. */
function finish(guildId: string, row: Row, player: Card[], deck: Card[]): Finished {
  const dealer = JSON.parse(row.dealer) as Card[];
  if (total(player) <= 21 && !isBlackjack(player)) dealerPlays(dealer, deck);
  const outcome = outcomeOf(player, dealer);
  const multiplier = outcome === 'bust' ? 0 : PAYOUTS[outcome];
  run('DELETE FROM blackjack_games WHERE guild_id = ? AND user_id = ?', guildId, row.user_id);
  const settlement = bets.settle(guildId, row.user_id, row.stake, multiplier);
  return {
    userId: row.user_id,
    stake: row.stake,
    player,
    dealer,
    doubled: row.doubled === 1,
    outcome,
    settlement,
  };
}

/** The hand a member is playing, if any. */
export function current(guildId: string, userId: string): Hand | null {
  const row = load(guildId, userId);
  return row ? handOf(row) : null;
}

/**
 * Places the bet and deals. A natural blackjack (or the dealer's) ends the
 * hand at once. Returns the bet error, or the dealt hand.
 */
export function start(
  guildId: string,
  user: UserRef,
  input: string,
  deck: Card[] = freshDeck(),
):
  | Exclude<BetResult, { ok: true }>
  | { ok: false; reason: 'playing' }
  | Extract<PlayResult, { ok: true }> {
  if (load(guildId, user.id)) return { ok: false, reason: 'playing' };
  return transaction(() => {
    const bet = bets.placeBet(guildId, user, input, 'blackjack');
    if (!bet.ok) return bet;
    const player = [deck.pop()!, deck.pop()!];
    const dealer = [deck.pop()!, deck.pop()!];
    run(
      `INSERT INTO blackjack_games (guild_id, user_id, stake, deck, player, dealer, doubled, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      guildId,
      user.id,
      bet.amount,
      JSON.stringify(deck),
      JSON.stringify(player),
      JSON.stringify(dealer),
      Date.now(),
    );
    const row = load(guildId, user.id)!;
    if (isBlackjack(player) || isBlackjack(dealer)) {
      return { ok: true, state: 'done', hand: finish(guildId, row, player, deck) };
    }
    return { ok: true, state: 'playing', hand: handOf(row) };
  });
}

/** Hit, stand or double down. */
export function play(guildId: string, userId: string, move: Move): PlayResult {
  return transaction(() => {
    const row = load(guildId, userId);
    if (!row) return { ok: false, reason: 'none' };
    const hand = handOf(row);
    const deck = JSON.parse(row.deck) as Card[];
    const player = [...hand.player];

    if (move === 'double') {
      if (!hand.canDouble) return { ok: false, reason: 'cannotDouble' };
      if (!accounts.debit(guildId, userId, row.stake, 'bet')) return { ok: false, reason: 'funds' };
      row.stake *= 2;
      row.doubled = 1;
    }
    if (move === 'hit' || move === 'double') player.push(deck.pop()!);

    if (move === 'stand' || move === 'double' || total(player) >= 21) {
      return { ok: true, state: 'done', hand: finish(guildId, row, player, deck) };
    }
    run(
      `UPDATE blackjack_games SET deck = ?, player = ?, updated_at = ?
       WHERE guild_id = ? AND user_id = ?`,
      JSON.stringify(deck),
      JSON.stringify(player),
      Date.now(),
      guildId,
      userId,
    );
    return { ok: true, state: 'playing', hand: { ...hand, player, canDouble: false } };
  });
}

/** Stands every hand idle for longer than IDLE_MS. Returns the finished hands. */
export function expire(now = Date.now()): { guildId: string; hand: Finished }[] {
  const stale = many<{ guild_id: string; user_id: string }>(
    'SELECT guild_id, user_id FROM blackjack_games WHERE updated_at < ?',
    now - IDLE_MS,
  );
  return stale.flatMap(({ guild_id: guildId, user_id: userId }) => {
    const result = play(guildId, userId, 'stand');
    return result.ok && result.state === 'done' ? [{ guildId, hand: result.hand }] : [];
  });
}
