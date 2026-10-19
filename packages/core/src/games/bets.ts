import * as accounts from '../services/accounts.ts';
import * as cooldowns from '../services/cooldowns.ts';
import { MIN_BET, type GameName } from '../config/games.ts';
import { parseAmount } from '../utils/parse.ts';
import type { UserRef } from '../types.ts';

export type BetResult =
  | { ok: true; amount: number }
  | { ok: false; reason: 'cooldown'; remainingMs: number }
  | { ok: false; reason: 'minWallet' | 'funds'; wallet: number }
  | { ok: false; reason: 'invalid' | 'minBet' };

/**
 * Validates and charges a bet in one go. On success the stake is already
 * taken from the wallet and the game cooldown has started.
 */
export function placeBet(guildId: string, user: UserRef, input: string, game: GameName): BetResult {
  const remainingMs = cooldowns.remaining(guildId, user.id, game);
  if (remainingMs) return { ok: false, reason: 'cooldown', remainingMs };

  const { wallet } = accounts.getAccount(guildId, user);
  if (wallet < MIN_BET) return { ok: false, reason: 'minWallet', wallet };

  const amount = parseAmount(input, wallet);
  if (amount === null) return { ok: false, reason: 'invalid' };
  if (amount < MIN_BET) return { ok: false, reason: 'minBet' };
  if (!accounts.debit(guildId, user.id, amount, 'bet'))
    return { ok: false, reason: 'funds', wallet };

  cooldowns.startConfigured(guildId, user.id, game);
  return { ok: true, amount };
}

export interface Settlement {
  stake: number;
  payout: number;
  /** payout − stake */
  net: number;
  wallet: number;
}

/** Pays out `stake × multiplier`. */
export function settle(
  guildId: string,
  userId: string,
  stake: number,
  multiplier: number,
): Settlement {
  const payout = Math.floor(stake * multiplier);
  if (payout > 0) accounts.credit(guildId, userId, payout, 'payout');
  return {
    stake,
    payout,
    net: payout - stake,
    wallet: accounts.findAccount(guildId, userId)!.wallet,
  };
}
