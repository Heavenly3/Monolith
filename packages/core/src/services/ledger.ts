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
  | 'level'
  | 'import'
  | 'start'
  | 'crime'
  | 'chat';

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

// Moves inside a member's own money, and admin tools, are not activity.
const NOT_ACTIVITY: LedgerReason[] = [
  'deposit',
  'withdraw',
  'transfer',
  'admin',
  'import',
  'start',
];

export interface DayActivity {
  /** Start of the day (UTC), in milliseconds. */
  day: number;
  /** Credits members received (work, prizes, payouts, income...). */
  earned: number;
  /** Credits members paid (bets, purchases, fines, tickets...). */
  spent: number;
  /** Number of movements and distinct members behind them. */
  movements: number;
  members: number;
}

const DAY = 86_400_000;

/** Credits earned and spent per day over the last `days` days, oldest first. */
export function activity(guildId: string, days = 7, now = Date.now()): DayActivity[] {
  const today = Math.floor(now / DAY) * DAY;
  const from = today - (days - 1) * DAY;
  const skip = NOT_ACTIVITY.map(() => '?').join(', ');
  const rows = many<{
    day: number;
    earned: number;
    spent: number;
    movements: number;
    members: number;
  }>(
    `SELECT (created_at / ${DAY}) * ${DAY} AS day,
            COALESCE(SUM(CASE WHEN delta > 0 THEN delta END), 0) AS earned,
            COALESCE(SUM(CASE WHEN delta < 0 THEN -delta END), 0) AS spent,
            COUNT(*) AS movements,
            COUNT(DISTINCT user_id) AS members
     FROM ledger
     WHERE guild_id = ? AND created_at >= ? AND reason NOT IN (${skip})
     GROUP BY day`,
    guildId,
    from,
    ...NOT_ACTIVITY,
  );
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return Array.from({ length: days }, (_, i) => {
    const day = from + i * DAY;
    const row = byDay.get(day);
    return {
      day,
      earned: row?.earned ?? 0,
      spent: row?.spent ?? 0,
      movements: row?.movements ?? 0,
      members: row?.members ?? 0,
    };
  });
}
