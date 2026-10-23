import { transaction } from '../db/database.ts';
import * as accounts from './accounts.ts';
import * as cooldowns from './cooldowns.ts';
import * as settings from './settings.ts';
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

  const success = roll < settings.get(guildId, 'rob.chance') / 100;
  const amount = transaction(() => {
    if (success) {
      const steal = settings.get(guildId, 'rob.steal') / 100;
      const percent = randomFloat(Math.min(ROB.stealPercent.min, steal), steal);
      const wanted = Math.max(1, Math.floor(targetAccount.wallet * percent));
      const stolen = accounts.debitUpTo(guildId, target.id, wanted, 'rob');
      accounts.credit(guildId, thief.id, stolen, 'rob');
      return stolen;
    }
    const finePercent = settings.get(guildId, 'rob.fine') / 100;
    if (finePercent <= 0) return 0;
    const percent = randomFloat(Math.min(ROB.finePercent.min, finePercent), finePercent);
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
