import { transaction } from '../db/database.ts';
import * as accounts from './accounts.ts';
import * as cooldowns from './cooldowns.ts';
import { ROB } from '../config/games.ts';
import { randomFloat } from '../utils/random.ts';
import type { UserRef } from '../types.ts';

export type RobResult =
  | { ok: true; success: boolean; amount: number; readyAt: number; wallet: number }
  | { ok: false; reason: 'self' | 'thiefPoor' | 'targetPoor' }
  | { ok: false; reason: 'cooldown'; remainingMs: number };

/**
 * Tries to steal part of another member's wallet. On failure the thief pays
 * a fine to the victim. `roll` is injectable for tests.
 */
export function attempt(
  guildId: string,
  thief: UserRef,
  target: UserRef,
  roll = randomFloat(),
): RobResult {
  if (thief.id === target.id) return { ok: false, reason: 'self' };

  const remainingMs = cooldowns.remaining(guildId, thief.id, 'rob');
  if (remainingMs) return { ok: false, reason: 'cooldown', remainingMs };

  const thiefAccount = accounts.getAccount(guildId, thief);
  const targetAccount = accounts.getAccount(guildId, target);
  if (thiefAccount.wallet < ROB.minThiefWallet) return { ok: false, reason: 'thiefPoor' };
  if (targetAccount.wallet < ROB.minTargetWallet) return { ok: false, reason: 'targetPoor' };

  const success = roll < ROB.successChance;
  const amount = transaction(() => {
    if (success) {
      const percent = randomFloat(ROB.stealPercent.min, ROB.stealPercent.max);
      const wanted = Math.max(1, Math.floor(targetAccount.wallet * percent));
      const stolen = accounts.debitUpTo(guildId, target.id, wanted, 'rob');
      accounts.credit(guildId, thief.id, stolen, 'rob');
      return stolen;
    }
    const percent = randomFloat(ROB.finePercent.min, ROB.finePercent.max);
    const fine = accounts.debitUpTo(
      guildId,
      thief.id,
      Math.max(1, Math.floor(thiefAccount.wallet * percent)),
      'fine',
    );
    accounts.credit(guildId, target.id, fine, 'fine');
    return fine;
  });

  const readyAt = cooldowns.startConfigured(guildId, thief.id, 'rob');
  return {
    ok: true,
    success,
    amount,
    readyAt,
    wallet: accounts.findAccount(guildId, thief.id)!.wallet,
  };
}
