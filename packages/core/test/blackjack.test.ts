import { beforeEach, describe, expect, it } from 'vitest';
import { accounts, blackjack, cooldowns, type BlackjackCard } from '../src/index.ts';
import { GUILD, alice, freshDatabase } from './helpers.ts';

/** Deck that deals `cards` in order (cards are drawn from the end). */
const deck = (...cards: BlackjackCard[]): BlackjackCard[] => [...cards].reverse();

beforeEach(() => {
  freshDatabase();
  accounts.getAccount(GUILD, alice);
  accounts.credit(GUILD, alice.id, 1000, 'admin');
});

const wallet = () => accounts.findAccount(GUILD, alice.id)!.wallet;

describe('blackjack', () => {
  it('counts aces as 11 or 1', () => {
    expect(blackjack.total(['AS', 'KH'])).toBe(21);
    expect(blackjack.total(['AS', 'AH', '9D'])).toBe(21);
    expect(blackjack.total(['AS', 'KH', '5D'])).toBe(16);
    expect(blackjack.isBlackjack(['AS', 'QC'])).toBe(true);
  });

  it('pays a natural blackjack 3:2 at once', () => {
    const result = blackjack.start(GUILD, alice, '100', deck('AS', 'KH', '9D', '7C'));
    expect(result).toMatchObject({ ok: true, state: 'done', hand: { outcome: 'blackjack' } });
    expect(wallet()).toBe(1150);
    expect(blackjack.current(GUILD, alice.id)).toBeNull();
  });

  it('plays a hand: hit, then stand against a dealer who draws to 17', () => {
    // Player 10+6, dealer 9+5; player hits a 4 (20), dealer draws 2 then 8 (24, bust).
    const dealt = blackjack.start(
      GUILD,
      alice,
      '200',
      deck('10S', '6H', '9D', '5C', '4S', '2H', '8D'),
    );
    expect(dealt).toMatchObject({ ok: true, state: 'playing' });
    expect(blackjack.start(GUILD, alice, '200')).toEqual({ ok: false, reason: 'playing' });

    expect(blackjack.play(GUILD, alice.id, 'hit')).toMatchObject({
      state: 'playing',
      hand: { player: ['10S', '6H', '4S'], canDouble: false },
    });
    expect(blackjack.play(GUILD, alice.id, 'double')).toEqual({
      ok: false,
      reason: 'cannotDouble',
    });
    const done = blackjack.play(GUILD, alice.id, 'stand');
    expect(done).toMatchObject({ state: 'done', hand: { outcome: 'win' } });
    expect(wallet()).toBe(1200);
    expect(blackjack.play(GUILD, alice.id, 'stand')).toEqual({ ok: false, reason: 'none' });
  });

  it('doubles the stake for one card and settles busts and pushes', () => {
    blackjack.start(GUILD, alice, '300', deck('5S', '6H', '10D', '7C', 'KS'));
    const doubled = blackjack.play(GUILD, alice.id, 'double');
    expect(doubled).toMatchObject({ hand: { outcome: 'win', doubled: true, stake: 600 } });
    expect(wallet()).toBe(1600);

    cooldowns.clear(GUILD, alice.id, 'blackjack');
    blackjack.start(GUILD, alice, '100', deck('10S', '7H', '10D', '7C'));
    expect(blackjack.play(GUILD, alice.id, 'stand')).toMatchObject({ hand: { outcome: 'push' } });
    expect(wallet()).toBe(1600);

    cooldowns.clear(GUILD, alice.id, 'blackjack');
    blackjack.start(GUILD, alice, '100', deck('10S', '6H', '10D', '7C', 'QS'));
    expect(blackjack.play(GUILD, alice.id, 'hit')).toMatchObject({ hand: { outcome: 'bust' } });
    expect(wallet()).toBe(1500);
  });

  it('stands idle hands', () => {
    blackjack.start(GUILD, alice, '100', deck('10S', '9H', '10D', '7C'));
    expect(blackjack.expire(Date.now())).toEqual([]);
    const [expired] = blackjack.expire(Date.now() + blackjack.IDLE_MS + 1000);
    expect(expired).toMatchObject({ guildId: GUILD, hand: { outcome: 'win' } });
    expect(wallet()).toBe(1100);
  });
});
