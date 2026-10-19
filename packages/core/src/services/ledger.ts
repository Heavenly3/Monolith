import { many, run } from '../db/database.ts';
import type { Balance } from '../types.ts';

/** Why a balance changed. Shown in member histories and the dashboard. */
export type LedgerReason =
  | 'work'
  | 'collect'
  | 'wheel'
  | 'bet'
  | 'payout'
  | 'transfer'
  | 'deposit'
  | 'withdraw'
  | 'rob'
  | 'fine'
  | 'loan'
  | 'loan_repay'
  | 'loan_collect'
  | 'purchase'
  | 'refund'
  | 'raffle_ticket'
  | 'raffle_win'
  | 'admin'
  | 'import';

export interface LedgerEntry {
  id: number;
  guildId: string;
  userId: string;
  account: Balance;
  delta: number;
  balance: number;
  reason: LedgerReason;
  createdAt: number;
}

interface LedgerRow {
  id: number;
  guild_id: string;
  user_id: string;
  account: Balance;
  delta: number;
  balance: number;
  reason: LedgerReason;
  created_at: number;
}

const toEntry = (row: LedgerRow): LedgerEntry => ({
  id: row.id,
  guildId: row.guild_id,
  userId: row.user_id,
  account: row.account,
  delta: row.delta,
  balance: row.balance,
  reason: row.reason,
  createdAt: row.created_at,
});

export function record(
  guildId: string,
  userId: string,
  account: Balance,
  delta: number,
  balance: number,
  reason: LedgerReason,
): void {
  if (delta === 0) return;
  run(
    `INSERT INTO ledger (guild_id, user_id, account, delta, balance, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    guildId,
    userId,
    account,
    delta,
    balance,
    reason,
    Date.now(),
  );
}

/** Latest movements of one member. */
export function history(guildId: string, userId: string, limit = 20): LedgerEntry[] {
  return many<LedgerRow>(
    'SELECT * FROM ledger WHERE guild_id = ? AND user_id = ? ORDER BY id DESC LIMIT ?',
    guildId,
    userId,
    limit,
  ).map(toEntry);
}

/** Latest movements of a whole server. */
export function recent(guildId: string, limit = 50): LedgerEntry[] {
  return many<LedgerRow>(
    'SELECT * FROM ledger WHERE guild_id = ? ORDER BY id DESC LIMIT ?',
    guildId,
    limit,
  ).map(toEntry);
}
