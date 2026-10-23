import * as accounts from '../services/accounts.ts';
import * as cooldowns from '../services/cooldowns.ts';
import type { GameName } from '../config/games.ts';
import * as settings from '../services/settings.ts';
import { parseAmount } from '../utils/parse.ts';
import type { UserRef } from '../types.ts';

export type BetResult =
  | { ok: true; amount: number }
  | { ok: false; reason: 'cooldown'; remainingMs: number }
  | { ok: false; reason: 'minWallet'; wallet: number; min: number }
  | { ok: false; reason: 'funds'; wallet: number }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'minBet'; min: number }
  | { ok: false; reason: 'maxBet'; max: number };

/** Smallest and largest bet of a server (max 0 = no limit). */
export const betLimits = (guildId: string): { min: number; max: number } => ({
  min: settings.get(guildId, 'bet.min'),
  max: settings.get(guildId, 'bet.max'),
});

/**
 * Validates and charges a bet in one go. On success the stake is already
 * taken from the wallet and the game cooldown has started.
 */
export function placeBet(guildId: string, user: UserRef, input: string, game: GameName): BetResult {
  const remainingMs = cooldowns.remaining(guildId, user.id, game);
  if (remainingMs) return { ok: false, reason: 'cooldown', remainingMs };

  const { min, max } = betLimits(guildId);
  const { wallet } = accounts.getAccount(guildId, user);
  if (wallet < min) return { ok: false, reason: 'minWallet', wallet, min };

  const amount = parseAmount(input, wallet);
  if (amount === null) return { ok: false, reason: 'invalid' };
  if (amount < min) return { ok: false, reason: 'minBet', min };
  if (max > 0 && amount > max) return { ok: false, reason: 'maxBet', max };
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
  // The stake always comes back; winnings stop at the maximum balance.
  const wanted = Math.floor(stake * multiplier);
  const returned = Math.min(stake, wanted);
  if (returned > 0) accounts.credit(guildId, userId, returned, 'payout');
  const payout =
    returned + (wanted > stake ? accounts.earn(guildId, userId, wanted - stake, 'payout') : 0);
  return {
    stake,
    payout,
    net: payout - stake,
    wallet: accounts.findAccount(guildId, userId)!.wallet,
  };
}
