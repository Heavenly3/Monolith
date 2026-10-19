import { many, one, run, transaction } from '../db/database.ts';
import * as accounts from './accounts.ts';
import * as settings from './settings.ts';
import type { Loan } from '../types.ts';

interface LoanRow {
  guild_id: string;
  user_id: string;
  principal: number;
  interest_rate: number;
  amount_due: number;
  due_at: number;
  created_at: number;
}

const toLoan = (row: LoanRow): Loan => ({
  guildId: row.guild_id,
  userId: row.user_id,
  principal: row.principal,
  interestRate: row.interest_rate,
  amountDue: row.amount_due,
  dueAt: row.due_at,
  createdAt: row.created_at,
});

export function getLoan(guildId: string, userId: string): Loan | null {
  const row = one<LoanRow>(
    'SELECT * FROM loans WHERE guild_id = ? AND user_id = ?',
    guildId,
    userId,
  );
  return row ? toLoan(row) : null;
}

export function listLoans(guildId: string): Loan[] {
  return many<LoanRow>('SELECT * FROM loans WHERE guild_id = ? ORDER BY due_at', guildId).map(
    toLoan,
  );
}

/** What a loan of `amount` would cost right now. */
export function terms(
  guildId: string,
  amount: number,
): { interestRate: number; amountDue: number; dueAt: number } {
  const interestRate = settings.get(guildId, 'loan.interestRate');
  return {
    interestRate,
    amountDue: amount + Math.ceil((amount * interestRate) / 100),
    dueAt: Date.now() + settings.get(guildId, 'loan.duration') * 1000,
  };
}

export type LoanRequest =
  { ok: true; loan: Loan } | { ok: false; reason: 'active' | 'negative' | 'range'; max: number };

/** Validates and grants a loan, crediting the wallet. */
export function requestLoan(guildId: string, userId: string, amount: number | null): LoanRequest {
  const max = settings.get(guildId, 'loan.maxAmount');
  return transaction((): LoanRequest => {
    if (getLoan(guildId, userId)) return { ok: false, reason: 'active', max };
    const account = accounts.findAccount(guildId, userId);
    if (account && (account.wallet < 0 || account.bank < 0))
      return { ok: false, reason: 'negative', max };
    if (amount === null || amount <= 0 || amount > max) return { ok: false, reason: 'range', max };

    const { interestRate, amountDue, dueAt } = terms(guildId, amount);
    run(
      `INSERT INTO loans (guild_id, user_id, principal, interest_rate, amount_due, due_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      guildId,
      userId,
      amount,
      interestRate,
      amountDue,
      dueAt,
      Date.now(),
    );
    accounts.credit(guildId, userId, amount, 'loan');
    return { ok: true, loan: getLoan(guildId, userId)! };
  });
}

export type RepayResult =
  | { ok: true; loan: Loan }
  | { ok: false; reason: 'none' }
  | { ok: false; reason: 'funds'; loan: Loan };

/** Repays the whole loan from the wallet. */
export function repay(guildId: string, userId: string): RepayResult {
  return transaction((): RepayResult => {
    const loan = getLoan(guildId, userId);
    if (!loan) return { ok: false, reason: 'none' };
    if (!accounts.debit(guildId, userId, loan.amountDue, 'loan_repay')) {
      return { ok: false, reason: 'funds', loan };
    }
    run('DELETE FROM loans WHERE guild_id = ? AND user_id = ?', guildId, userId);
    return { ok: true, loan };
  });
}

export function cancel(guildId: string, userId: string): boolean {
  return run('DELETE FROM loans WHERE guild_id = ? AND user_id = ?', guildId, userId).changes > 0;
}

export function cancelAll(guildId: string): number {
  return run('DELETE FROM loans WHERE guild_id = ?', guildId).changes;
}

export interface CollectedLoan extends Loan {
  /** What could not be covered and was left as negative wallet balance. */
  shortfall: number;
}

/**
 * Collects every overdue loan of every server: wallet first, then bank, and
 * whatever is still missing is left as a negative wallet balance.
 */
export function collectOverdue(now = Date.now()): CollectedLoan[] {
  return many<LoanRow>('SELECT * FROM loans WHERE due_at <= ?', now).map((row) =>
    transaction(() => {
      const loan = toLoan(row);
      let remaining = loan.amountDue;
      remaining -= accounts.debitUpTo(
        loan.guildId,
        loan.userId,
        remaining,
        'loan_collect',
        'wallet',
      );
      remaining -= accounts.debitUpTo(loan.guildId, loan.userId, remaining, 'loan_collect', 'bank');
      if (remaining > 0) accounts.forceDebit(loan.guildId, loan.userId, remaining, 'loan_collect');
      run('DELETE FROM loans WHERE guild_id = ? AND user_id = ?', loan.guildId, loan.userId);
      return { ...loan, shortfall: remaining };
    }),
  );
}
