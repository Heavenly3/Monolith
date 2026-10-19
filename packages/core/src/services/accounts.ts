import { many, one, run, transaction } from '../db/database.ts';
import * as ledger from './ledger.ts';
import type { LedgerReason } from './ledger.ts';
import type { Account, Balance, LeaderboardRow, UserRef } from '../types.ts';

interface AccountRow {
  guild_id: string;
  user_id: string;
  wallet: number;
  bank: number;
}

const toAccount = (row: AccountRow): Account => ({
  guildId: row.guild_id,
  userId: row.user_id,
  wallet: row.wallet,
  bank: row.bank,
});

function assertAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError(`Invalid amount ${amount}`);
}

// The column name is never user input: it comes from the Balance type.
const column = (account: Balance): Balance => (account === 'bank' ? 'bank' : 'wallet');

/** Stores the latest username and Discord language of a user (global, not per server). */
export function rememberProfile(user: UserRef, locale?: string | null): void {
  run(
    `INSERT INTO profiles (user_id, username, locale) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       username = excluded.username,
       locale = COALESCE(excluded.locale, profiles.locale),
       updated_at = ?
     WHERE profiles.username IS NOT excluded.username
        OR (excluded.locale IS NOT NULL AND profiles.locale IS NOT excluded.locale)`,
    user.id,
    user.username,
    locale ?? null,
    Date.now(),
  );
}

export function getProfile(
  userId: string,
): { username: string | null; locale: string | null } | null {
  return (
    one<{ username: string | null; locale: string | null }>(
      'SELECT username, locale FROM profiles WHERE user_id = ?',
      userId,
    ) ?? null
  );
}

/** The account of a member in a server, created on first use. */
export function getAccount(guildId: string, user: UserRef): Account {
  rememberProfile(user);
  run(
    'INSERT INTO accounts (guild_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
    guildId,
    user.id,
  );
  return findAccount(guildId, user.id)!;
}

export function findAccount(guildId: string, userId: string): Account | null {
  const row = one<AccountRow>(
    'SELECT guild_id, user_id, wallet, bank FROM accounts WHERE guild_id = ? AND user_id = ?',
    guildId,
    userId,
  );
  return row ? toAccount(row) : null;
}

function balanceOf(guildId: string, userId: string, account: Balance): number {
  return findAccount(guildId, userId)?.[account] ?? 0;
}

function apply(
  guildId: string,
  userId: string,
  account: Balance,
  delta: number,
  reason: LedgerReason,
): void {
  const col = column(account);
  run(
    `UPDATE accounts SET ${col} = ${col} + ?, updated_at = ? WHERE guild_id = ? AND user_id = ?`,
    delta,
    Date.now(),
    guildId,
    userId,
  );
  ledger.record(guildId, userId, account, delta, balanceOf(guildId, userId, account), reason);
}

export function credit(
  guildId: string,
  userId: string,
  amount: number,
  reason: LedgerReason,
  account: Balance = 'wallet',
): void {
  assertAmount(amount);
  if (amount > 0) transaction(() => apply(guildId, userId, account, amount, reason));
}

/** Removes `amount` only if the balance covers it. Returns success. */
export function debit(
  guildId: string,
  userId: string,
  amount: number,
  reason: LedgerReason,
  account: Balance = 'wallet',
): boolean {
  assertAmount(amount);
  return transaction(() => {
    if (balanceOf(guildId, userId, account) < amount) return false;
    apply(guildId, userId, account, -amount, reason);
    return true;
  });
}

/** Removes up to `amount` and returns how much was actually taken. */
export function debitUpTo(
  guildId: string,
  userId: string,
  amount: number,
  reason: LedgerReason,
  account: Balance = 'wallet',
): number {
  assertAmount(amount);
  return transaction(() => {
    const taken = Math.max(0, Math.min(balanceOf(guildId, userId, account), amount));
    if (taken > 0) apply(guildId, userId, account, -taken, reason);
    return taken;
  });
}

/** Subtracts without a floor (overdue debt can leave the wallet negative). */
export function forceDebit(
  guildId: string,
  userId: string,
  amount: number,
  reason: LedgerReason,
  account: Balance = 'wallet',
): void {
  assertAmount(amount);
  if (amount > 0) transaction(() => apply(guildId, userId, account, -amount, reason));
}

/** Moves money between the wallet and the bank of one member. */
export function move(guildId: string, userId: string, from: Balance, amount: number): boolean {
  const to: Balance = from === 'wallet' ? 'bank' : 'wallet';
  const reason: LedgerReason = from === 'wallet' ? 'deposit' : 'withdraw';
  return transaction(() => {
    if (!debit(guildId, userId, amount, reason, from)) return false;
    credit(guildId, userId, amount, reason, to);
    return true;
  });
}

/** Wallet-to-wallet payment between two members. */
export function transfer(guildId: string, fromId: string, toId: string, amount: number): boolean {
  return transaction(() => {
    if (!debit(guildId, fromId, amount, 'transfer')) return false;
    credit(guildId, toId, amount, 'transfer');
    return true;
  });
}

/** Sets an exact balance (admin tool). */
export function setBalance(
  guildId: string,
  userId: string,
  account: Balance,
  amount: number,
): void {
  transaction(() => {
    const delta = amount - balanceOf(guildId, userId, account);
    if (delta !== 0) apply(guildId, userId, account, delta, 'admin');
  });
}

export function leaderboard(guildId: string, limit: number, offset = 0): LeaderboardRow[] {
  return many<{ user_id: string; username: string | null; wallet: number; bank: number }>(
    `SELECT a.user_id, p.username, a.wallet, a.bank FROM accounts a
     LEFT JOIN profiles p ON p.user_id = a.user_id
     WHERE a.guild_id = ? AND a.wallet + a.bank > 0
     ORDER BY a.wallet + a.bank DESC, a.user_id LIMIT ? OFFSET ?`,
    guildId,
    limit,
    offset,
  ).map((row) => ({
    userId: row.user_id,
    username: row.username,
    wallet: row.wallet,
    bank: row.bank,
    netWorth: row.wallet + row.bank,
  }));
}

export function leaderboardSize(guildId: string): number {
  return (
    one<{ total: number }>(
      'SELECT COUNT(*) AS total FROM accounts WHERE guild_id = ? AND wallet + bank > 0',
      guildId,
    )?.total ?? 0
  );
}

/** Position on the leaderboard, or null when the member has no money. */
export function rankOf(guildId: string, userId: string): number | null {
  const account = findAccount(guildId, userId);
  if (!account || account.wallet + account.bank <= 0) return null;
  return (
    one<{ rank: number }>(
      'SELECT COUNT(*) + 1 AS rank FROM accounts WHERE guild_id = ? AND wallet + bank > ?',
      guildId,
      account.wallet + account.bank,
    )?.rank ?? null
  );
}

/** Totals of a server's economy. */
export function stats(guildId: string): { accounts: number; wallets: number; banks: number } {
  return (
    one<{ accounts: number; wallets: number; banks: number }>(
      `SELECT COUNT(*) AS accounts, COALESCE(SUM(wallet), 0) AS wallets, COALESCE(SUM(bank), 0) AS banks
       FROM accounts WHERE guild_id = ? AND (wallet <> 0 OR bank <> 0)`,
      guildId,
    ) ?? { accounts: 0, wallets: 0, banks: 0 }
  );
}

export const MONEY_ACTIONS = ['add', 'remove', 'set', 'reset'] as const;
export type MoneyAction = (typeof MONEY_ACTIONS)[number];

export interface Adjustment {
  before: Account;
  after: Account;
  /** Amount actually moved (removing stops at zero). */
  amount: number;
}

/**
 * Admin change of a member's gold, shared by the bot panel and the dashboard.
 * `amount` is ignored for "reset".
 */
export function adjust(
  guildId: string,
  user: UserRef,
  action: MoneyAction,
  account: Balance,
  amount: number,
): Adjustment {
  return transaction(() => {
    const before = getAccount(guildId, user);
    let moved = amount;
    switch (action) {
      case 'add':
        credit(guildId, user.id, amount, 'admin', account);
        break;
      case 'remove':
        moved = debitUpTo(guildId, user.id, amount, 'admin', account);
        break;
      case 'set':
        setBalance(guildId, user.id, account, amount);
        break;
      case 'reset':
        setBalance(guildId, user.id, 'wallet', 0);
        setBalance(guildId, user.id, 'bank', 0);
        moved = 0;
        break;
    }
    return { before, after: findAccount(guildId, user.id)!, amount: moved };
  });
}
