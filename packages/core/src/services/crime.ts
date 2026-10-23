// /crime: a risky job. It pays more than /work on success, but fails at the
// configured rate and then costs a fine, fixed or a share of the balance.
import { transaction } from '../db/database.ts';
import type { UserRef } from '../types.ts';
import { randomBetween, randomFloat } from '../utils/random.ts';
import * as accounts from './accounts.ts';
import * as cooldowns from './cooldowns.ts';
import * as settings from './settings.ts';

export type CrimeResult =
  | { ok: true; success: boolean; amount: number; readyAt: number; wallet: number }
  | { ok: false; reason: 'cooldown'; remainingMs: number };

/** Fine for a failed crime: credits, or a percent of wallet + bank. */
export function fineFor(guildId: string, userId: string, roll = randomFloat()): number {
  const { min, max } = settings.get(guildId, 'crime.fine');
  const share = min + Math.floor(roll * (max - min + 1));
  if (settings.get(guildId, 'crime.fineMode') === 'fixed') return share;
  const account = accounts.findAccount(guildId, userId);
  const balance = Math.max(0, (account?.wallet ?? 0) + (account?.bank ?? 0));
  return Math.floor((balance * share) / 100);
}

/**
 * Commits a crime. `roll` (0–1) decides success and is injectable for tests.
 * The fine comes from the wallet first, then the bank, never below zero.
 */
export function attempt(guildId: string, user: UserRef, roll = randomFloat()): CrimeResult {
  const remainingMs = cooldowns.remaining(guildId, user.id, 'crime');
  if (remainingMs) return { ok: false, reason: 'cooldown', remainingMs };

  accounts.getAccount(guildId, user);
  const success = roll >= settings.get(guildId, 'crime.failRate') / 100;
  const amount = transaction(() => {
    if (success) {
      const { min, max } = settings.get(guildId, 'crime.range');
      return accounts.earn(guildId, user.id, randomBetween(min, max), 'crime');
    }
    const fine = fineFor(guildId, user.id);
    const fromWallet = accounts.debitUpTo(guildId, user.id, fine, 'crime');
    return fromWallet + accounts.debitUpTo(guildId, user.id, fine - fromWallet, 'crime', 'bank');
  });

  const readyAt = cooldowns.startConfigured(guildId, user.id, 'crime');
  return {
    ok: true,
    success,
    amount,
    readyAt,
    wallet: accounts.findAccount(guildId, user.id)!.wallet,
  };
}
