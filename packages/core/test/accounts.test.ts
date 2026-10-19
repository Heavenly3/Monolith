import { beforeEach, describe, expect, it } from 'vitest';
import { accounts, ledger, settings } from '../src/index.ts';
import { GUILD, OTHER_GUILD, alice, bob, freshDatabase } from './helpers.ts';

beforeEach(freshDatabase);

describe('accounts', () => {
  it('creates an empty account on first use', () => {
    expect(accounts.getAccount(GUILD, alice)).toMatchObject({ wallet: 0, bank: 0 });
  });

  it('keeps one economy per server', () => {
    accounts.getAccount(GUILD, alice);
    accounts.getAccount(OTHER_GUILD, alice);
    accounts.credit(GUILD, alice.id, 500, 'admin');
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(500);
    expect(accounts.findAccount(OTHER_GUILD, alice.id)?.wallet).toBe(0);
  });

  it('never debits more than the balance', () => {
    accounts.getAccount(GUILD, alice);
    accounts.credit(GUILD, alice.id, 100, 'admin');
    expect(accounts.debit(GUILD, alice.id, 150, 'bet')).toBe(false);
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(100);
    expect(accounts.debitUpTo(GUILD, alice.id, 150, 'rob')).toBe(100);
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(0);
  });

  it('rejects negative or fractional amounts', () => {
    accounts.getAccount(GUILD, alice);
    expect(() => accounts.credit(GUILD, alice.id, -5, 'admin')).toThrow(RangeError);
    expect(() => accounts.debit(GUILD, alice.id, 1.5, 'bet')).toThrow(RangeError);
  });

  it('moves money between wallet and bank', () => {
    accounts.getAccount(GUILD, alice);
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    expect(accounts.move(GUILD, alice.id, 'wallet', 400)).toBe(true);
    expect(accounts.findAccount(GUILD, alice.id)).toMatchObject({ wallet: 600, bank: 400 });
    expect(accounts.move(GUILD, alice.id, 'bank', 500)).toBe(false);
  });

  it('transfers between members atomically', () => {
    accounts.getAccount(GUILD, alice);
    accounts.getAccount(GUILD, bob);
    accounts.credit(GUILD, alice.id, 300, 'admin');
    expect(accounts.transfer(GUILD, alice.id, bob.id, 500)).toBe(false);
    expect(accounts.transfer(GUILD, alice.id, bob.id, 200)).toBe(true);
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(100);
    expect(accounts.findAccount(GUILD, bob.id)?.wallet).toBe(200);
  });

  it('records every change in the ledger with the resulting balance', () => {
    accounts.getAccount(GUILD, alice);
    accounts.credit(GUILD, alice.id, 1000, 'work');
    accounts.debit(GUILD, alice.id, 250, 'bet');
    accounts.setBalance(GUILD, alice.id, 'bank', 50);
    const history = ledger.history(GUILD, alice.id);
    expect(history.map((e) => [e.reason, e.delta, e.balance])).toEqual([
      ['admin', 50, 50],
      ['bet', -250, 750],
      ['work', 1000, 1000],
    ]);
  });

  it('ranks members by net worth', () => {
    accounts.getAccount(GUILD, alice);
    accounts.getAccount(GUILD, bob);
    accounts.credit(GUILD, alice.id, 100, 'admin');
    accounts.credit(GUILD, bob.id, 500, 'admin', 'bank');
    expect(accounts.leaderboard(GUILD, 10).map((row) => row.userId)).toEqual([bob.id, alice.id]);
    expect(accounts.rankOf(GUILD, alice.id)).toBe(2);
    expect(accounts.stats(GUILD)).toEqual({ accounts: 2, wallets: 100, banks: 500 });
  });
});

describe('settings', () => {
  it('falls back to defaults and is isolated per server', () => {
    expect(settings.get(GUILD, 'work.cooldown')).toBe(3600);
    settings.set(GUILD, 'work.cooldown', 60);
    expect(settings.get(GUILD, 'work.cooldown')).toBe(60);
    expect(settings.get(OTHER_GUILD, 'work.cooldown')).toBe(3600);
    settings.reset(GUILD, 'work.cooldown');
    expect(settings.get(GUILD, 'work.cooldown')).toBe(3600);
  });

  it('returns copies that cannot corrupt the cache', () => {
    const range = settings.get(GUILD, 'work.range');
    range.min = 999;
    expect(settings.get(GUILD, 'work.range').min).toBe(50);
  });
});
