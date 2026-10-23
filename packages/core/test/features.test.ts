import { beforeEach, describe, expect, it } from 'vitest';
import { accounts, bets, cooldowns, loans, raffle, rob, shop, wheel, work } from '../src/index.ts';
import { GUILD, alice, bob, freshDatabase } from './helpers.ts';

beforeEach(() => {
  freshDatabase();
  accounts.getAccount(GUILD, alice);
  accounts.getAccount(GUILD, bob);
});

describe('bets', () => {
  it('charges the stake and starts the cooldown', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    expect(bets.placeBet(GUILD, alice, '500', 'slots')).toEqual({ ok: true, amount: 500 });
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(500);
    expect(bets.placeBet(GUILD, alice, '100', 'slots')).toMatchObject({
      ok: false,
      reason: 'cooldown',
    });
  });

  it('validates the amount', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    expect(bets.placeBet(GUILD, alice, 'abc', 'keno')).toEqual({ ok: false, reason: 'invalid' });
    expect(bets.placeBet(GUILD, alice, '50', 'keno')).toEqual({ ok: false, reason: 'minBet' });
    expect(bets.placeBet(GUILD, alice, '5000', 'keno')).toMatchObject({
      ok: false,
      reason: 'funds',
    });
    expect(bets.placeBet(GUILD, bob, 'all', 'keno')).toMatchObject({
      ok: false,
      reason: 'minWallet',
    });
  });

  it('pays stake × multiplier', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    bets.placeBet(GUILD, alice, '200', 'roulette');
    expect(bets.settle(GUILD, alice.id, 200, 2)).toEqual({
      stake: 200,
      payout: 400,
      net: 200,
      wallet: 1200,
    });
  });
});

describe('loans', () => {
  it('grants, repays and refuses a second loan', () => {
    const request = loans.requestLoan(GUILD, alice.id, 1000);
    expect(request.ok && request.loan.amountDue).toBe(1100);
    expect(loans.requestLoan(GUILD, alice.id, 1000)).toMatchObject({ ok: false, reason: 'active' });
    expect(loans.repay(GUILD, alice.id)).toMatchObject({ ok: false, reason: 'funds' });
    accounts.credit(GUILD, alice.id, 100, 'admin');
    expect(loans.repay(GUILD, alice.id)).toMatchObject({ ok: true });
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(0);
  });

  it('collects overdue loans from wallet, then bank, leaving debt', () => {
    loans.requestLoan(GUILD, alice.id, 1000);
    accounts.move(GUILD, alice.id, 'wallet', 300);
    accounts.debit(GUILD, alice.id, 600, 'bet');
    const [collected] = loans.collectOverdue(Date.now() + 10 * 86400 * 1000);
    expect(collected?.shortfall).toBe(700);
    expect(accounts.findAccount(GUILD, alice.id)).toMatchObject({ wallet: -700, bank: 0 });
    expect(loans.getLoan(GUILD, alice.id)).toBeNull();
  });

  it('enforces the maximum amount', () => {
    expect(loans.requestLoan(GUILD, alice.id, 10_000_000)).toMatchObject({
      ok: false,
      reason: 'range',
    });
  });
});

describe('raffle', () => {
  it('splits the pot between holders of the winning number', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    accounts.credit(GUILD, bob.id, 1000, 'admin');
    expect(raffle.buyTicket(GUILD, alice.id, 7, 'c1').ok).toBe(true);
    expect(raffle.buyTicket(GUILD, alice.id, 7, 'c1')).toMatchObject({
      ok: false,
      reason: 'duplicate',
    });
    raffle.buyTicket(GUILD, bob.id, 7, 'c1');
    const result = raffle.draw(GUILD, 7);
    expect(result.winners.sort()).toEqual([alice.id, bob.id]);
    expect(result.pot).toBe(700);
    expect(result.share).toBe(350);
    expect(raffle.getRound(GUILD)).toMatchObject({ pot: 500, drawAt: null });
  });

  it('rolls the pot over when nobody wins', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    raffle.buyTicket(GUILD, alice.id, 1, 'c1');
    const result = raffle.draw(GUILD, 2);
    expect(result.winners).toEqual([]);
    expect(raffle.getRound(GUILD).pot).toBe(600);
  });
});

describe('shop', () => {
  it('buys, uses and refunds items', () => {
    accounts.credit(GUILD, alice.id, 500, 'admin');
    const potion = shop.addProduct(GUILD, { name: 'Potion', price: 100, consumable: true });
    expect(shop.purchase(GUILD, alice.id, potion, 3)).toBe(true);
    expect(shop.purchase(GUILD, alice.id, potion, 5)).toBe(false);
    expect(shop.getQuantity(GUILD, alice.id, potion.id)).toBe(3);
    expect(shop.removeItem(GUILD, alice.id, potion.id, 2)).toBe(true);
    shop.refund(GUILD, alice.id, potion, 1);
    expect(shop.getInventory(GUILD, alice.id)).toEqual([]);
    expect(accounts.findAccount(GUILD, alice.id)?.wallet).toBe(300);
  });

  it('removing a product clears it from inventories', () => {
    accounts.credit(GUILD, alice.id, 500, 'admin');
    const item = shop.addProduct(GUILD, { name: 'Badge', price: 10, consumable: false });
    shop.purchase(GUILD, alice.id, item, 1);
    shop.removeProduct(GUILD, item.id);
    expect(shop.getInventory(GUILD, alice.id)).toEqual([]);
  });

  it('finds products by name ignoring case', () => {
    shop.addProduct(GUILD, { name: 'Grav Boots', price: 10, consumable: false });
    expect(shop.findProductByName(GUILD, 'grav boots')?.name).toBe('Grav Boots');
    expect(shop.searchProducts(GUILD, 'boo')).toHaveLength(1);
  });
});

describe('rob', () => {
  it('steals on success and fines on failure', () => {
    accounts.credit(GUILD, alice.id, 1000, 'admin');
    accounts.credit(GUILD, bob.id, 1000, 'admin');
    const success = rob.attempt(GUILD, alice, bob, 0);
    expect(success).toMatchObject({ ok: true, success: true });
    expect(rob.attempt(GUILD, alice, bob, 0)).toMatchObject({ ok: false, reason: 'cooldown' });
    cooldowns.clear(GUILD, alice.id, 'rob');
    const failure = rob.attempt(GUILD, alice, bob, 0.99);
    expect(failure).toMatchObject({ ok: true, success: false });
    const total = accounts.stats(GUILD);
    expect(total.wallets).toBe(2000);
  });
});

describe('wheel and work', () => {
  it('manages wheel prizes', () => {
    const before = wheel.getRewards(GUILD).length;
    expect(wheel.addReward(GUILD, { name: 'Mega', amount: 9999 })).toBe('ok');
    expect(wheel.removeReward(GUILD, before)?.name).toBe('Mega');
    expect(wheel.removeReward(GUILD, 999)).toBeNull();
  });

  it('customises job messages starting from the built-in ones', () => {
    const builtIn = ['a {amount}', 'b {amount}'];
    expect(work.usesBuiltIn(GUILD)).toBe(true);
    work.addMessage(GUILD, 'c {amount}', builtIn);
    expect(work.getMessages(GUILD, builtIn)).toEqual([...builtIn, 'c {amount}']);
    expect(work.usesBuiltIn(GUILD)).toBe(false);
    work.resetAll(GUILD);
    expect(work.usesBuiltIn(GUILD)).toBe(true);
  });
});
