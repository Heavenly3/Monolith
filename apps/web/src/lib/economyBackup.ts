// Reads a balance backup picked by an admin: our own JSON or CSV export, a
// plain list, or an object keyed by user id. Other bots call the wallet
// "cash" or "balance"; a file with only a total puts it in the wallet.
import { parseRows } from './backupFiles.ts';

export interface BalanceRecord {
  userId: string;
  wallet: number;
  bank: number;
}

const SNOWFLAKE = /^\d{17,20}$/;

const whole = (value: unknown): number | undefined => {
  const number = typeof value === 'string' ? Number(value.replace(/[,_\s]/g, '')) : value;
  return typeof number === 'number' && Number.isFinite(number) && number >= 0
    ? Math.floor(number)
    : undefined;
};

function record(id: unknown, source: Record<string, unknown>): BalanceRecord | null {
  const userId = String(id ?? '').trim();
  if (!SNOWFLAKE.test(userId)) return null;
  const wallet = whole(source.wallet ?? source.cash ?? source.balance ?? source.money);
  const bank = whole(source.bank);
  const total = whole(source.total ?? source.networth);
  if (wallet === undefined && bank === undefined && total === undefined) return null;
  if (wallet === undefined && bank === undefined) return { userId, wallet: total!, bank: 0 };
  return { userId, wallet: wallet ?? 0, bank: bank ?? 0 };
}

/** Balance records found in a file; an empty list when nothing is usable. */
export function parseEconomyBackup(text: string): BalanceRecord[] {
  const records = parseRows(text, 'total').flatMap(({ id, fields }) => record(id, fields) ?? []);
  // One record per member: the last one wins.
  return [...new Map(records.map((r) => [r.userId, r])).values()];
}
