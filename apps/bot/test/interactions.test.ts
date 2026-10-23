// End-to-end test of every command, button, menu and form through the real
// router, in English and Spanish, against an in-memory database.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type * as RespondModule from '../src/framework/respond.ts';
import {
  accounts,
  blackjack,
  closeDatabase,
  cooldowns,
  levels,
  loans,
  openDatabase,
  settings,
  settingsForm,
  shop,
} from '@monolith/core';

// Skip the small UI animations.
vi.mock('../src/framework/respond.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof RespondModule>()),
  wait: async () => {},
}));

// Rank images try to download the avatar; tests stay offline (the card draws an initial).
vi.stubGlobal('fetch', async () => {
  throw new Error('offline');
});

const { loadCommands } = await import('../src/framework/loader.ts');
const { default: router } = await import('../src/events/interactionCreate.ts');
const { default: onMessage } = await import('../src/events/messageCreate.ts');
const { createHarness, makeUser, role } = await import('./fakeDiscord.ts');
type FakeUser = ReturnType<typeof makeUser>;

const GUILD = 'guild-test';
const alice = makeUser('alice', 'alice');
const bob = makeUser('bob', 'bob');
const execute = async (interaction: unknown): Promise<unknown> =>
  router.execute(interaction as never);

let harness: ReturnType<typeof createHarness>;
let commandNames: string[] = [];

beforeAll(async () => {
  closeDatabase();
  settings.clearCache();
  openDatabase(':memory:');
  const commands = await loadCommands();
  commandNames = [...commands.keys()];
  harness = createHarness(commands, GUILD);
});

async function suite(locale: string) {
  type CommandOptions = {
    sub?: string;
    opts?: Record<string, unknown>;
    user?: FakeUser;
    admin?: boolean;
  };
  type ComponentOptions = {
    values?: string[];
    fields?: Record<string, unknown>;
    user?: FakeUser;
    admin?: boolean;
  };
  const cmd = (name: string, options: CommandOptions = {}) =>
    harness.command(execute, name, { user: alice, locale, ...options });
  const act = (customId: string, options: ComponentOptions = {}) =>
    harness.component(execute, customId, { user: alice, locale, ...options });
  const panel = (section: string, action: string, options: ComponentOptions = {}) =>
    act(`config:act:${section}:${action}`, options);
  const clearCooldowns = () => {
    for (const name of ['slots', 'roulette', 'horserace', 'keno', 'rob', 'work'] as const) {
      cooldowns.clear(GUILD, alice.id, name);
    }
  };
  const tag = locale.slice(0, 2);

  // Money and income set up from the admin panel
  await panel('members', 'save', {
    fields: { user: [alice], action: ['add'], account: ['wallet'], amount: '100000' },
  });
  await panel('members', 'save', {
    fields: { user: [bob], action: ['set'], account: ['wallet'], amount: '5000' },
  });
  await panel('collect', 'saveRole', { fields: { role: [role], amount: '300' } });
  await panel('shop', 'saveItem', {
    fields: { name: `VIP ${tag}`, price: '1000', type: ['permanent'], role: [role] },
  });
  await panel('shop', 'saveItem', {
    fields: { name: `Potion ${tag}`, price: '50', description: 'Heals', type: ['consumable'] },
  });

  // Economy
  await cmd('balance');
  await cmd('deposit', { opts: { amount: '10k' } });
  await cmd('deposit', { opts: { amount: 'nope' } });
  await cmd('withdraw', { opts: { amount: tag === 'es' ? 'mitad' : 'half' } });
  await cmd('pay', { opts: { user: bob, amount: '1000' } });
  await cmd('pay', { opts: { user: alice, amount: '1' } });
  await cmd('work');
  await cmd('work');
  await cmd('collect');
  await cmd('wheel');
  await cmd('rob', { opts: { user: bob } });
  await cmd('leaderboard');
  await act('leaderboard:page:alice:0');
  await act('leaderboard:page:alice:0', { user: bob });

  // Games
  for (const on of ['red', 'column2', 'dozen3', 'odd']) {
    clearCooldowns();
    await cmd('slots', { opts: { bet: '500' } });
    await cmd('roulette', { opts: { bet: '500', on } });
    await cmd('race', { opts: { bet: '1k', drone: 3 } });
    await cmd('keno', { opts: { bet: '500', numbers: '1 2 3 4 5 6 7 8 9 10' } });
  }
  await cmd('roulette', { opts: { bet: '500', on: 'straight' } });
  await cmd('keno', { opts: { bet: '500', numbers: '1 1 99' } });
  await cmd('slots', { opts: { bet: '5' } });
  await cmd('slots', { user: makeUser('poor', 'poor'), opts: { bet: 'all' } });
  await cmd('lottery', { sub: 'buy', opts: { number: 7 } });
  await cmd('lottery', { sub: 'buy', opts: { number: 7 } });
  await cmd('lottery', { sub: 'info' });

  // Loans
  await cmd('loan', { sub: 'status' });
  await cmd('loan', { sub: 'request', opts: { amount: '5k' } });
  await cmd('loan', { sub: 'request', opts: { amount: '5k' } });
  await cmd('loan', { sub: 'status' });
  await act('loan:repay:alice', { user: bob });
  await act('loan:repay:alice');
  await cmd('loan', { sub: 'repay' });

  // Shop
  await cmd('shop');
  await harness.autocomplete(execute, 'buy', { user: alice, focused: 'po', locale });
  await cmd('buy', { opts: { item: `Potion ${tag}`, quantity: 3 } });
  harness.memberRoles.delete(role.id);
  await cmd('buy', { opts: { item: `VIP ${tag}` } });
  await cmd('buy', { opts: { item: `VIP ${tag}` } });
  await cmd('buy', { opts: { item: 'does not exist' } });
  await cmd('inventory');
  await cmd('use', { opts: { item: `Potion ${tag}`, quantity: 2 } });
  await cmd('use', { opts: { item: `Potion ${tag}`, quantity: 20 } });
  await harness.autocomplete(execute, 'use', { user: alice, locale });
  const potion = shop.findProductByName(GUILD, `Potion ${tag}`)!;
  await act(`shop:buy:${potion.id}`);
  await act('shop:page:0');

  // Mission Control panel: every section and action
  await cmd('config');
  for (const section of [
    'general',
    'modules',
    'levels',
    'members',
    'work',
    'collect',
    'wheel',
    'games',
    'shop',
    'loans',
    'raffle',
  ]) {
    await act('config:view', { values: [section] });
  }
  await panel('general', 'language', { values: ['es'] });
  await panel('general', 'language', { values: ['auto'] });
  await panel('members', 'adjust');
  await panel('members', 'save', { fields: { user: [bob], action: ['remove'], amount: '100' } });
  await panel('members', 'save', { fields: { user: [bob], action: ['add'], amount: '' } });
  await panel('work', 'edit');
  await panel('work', 'save', { fields: { min: '10', max: '90', cooldown: '45m' } });
  await panel('work', 'save', { fields: { min: '100', max: '90', cooldown: '45m' } });
  await panel('work', 'add');
  await panel('work', 'saveMessage', { fields: { message: 'You fixed a probe for {amount}' } });
  await panel('work', 'remove', { values: ['0'] });
  await panel('work', 'reset');
  await panel('work', 'cancel');
  await panel('work', 'reset:yes');
  await panel('collect', 'add');
  await panel('collect', 'saveRole', { fields: { role: [role], amount: 'abc' } });
  await panel('collect', 'remove', { values: [role.id] });
  await panel('collect', 'clear:yes');
  await panel('wheel', 'savePrize', { fields: { amount: '9999', label: 'Supernova' } });
  await panel('wheel', 'remove', { values: ['0'] });
  await panel('wheel', 'resetPrizes');
  await panel('wheel', 'resetPrizes:yes');
  await panel('games', 'save', {
    fields: { slots: '10s', roulette: '20s', horserace: '30s', keno: '40s', rob: '3h' },
  });
  await panel('games', 'save', {
    fields: { slots: 'x', roulette: '20s', horserace: '30s', keno: '40s', rob: '3h' },
  });
  await panel('games', 'reset');
  await panel('shop', 'saveItem', {
    fields: { name: `Potion ${tag}`, price: '15', type: ['consumable'] },
  });
  await panel('shop', 'saveItem', {
    fields: { name: 'Bad price', price: 'free', type: ['consumable'] },
  });
  const vip = shop.findProductByName(GUILD, `VIP ${tag}`)!;
  await panel('shop', 'remove', { values: [String(vip.id)] });
  await act(`config:act:shop:remove:${vip.id}:yes`);
  accounts.getAccount(GUILD, bob);
  loans.requestLoan(GUILD, bob.id, 1000);
  await panel('loans', 'cancel', { values: [bob.id] });
  await panel('loans', 'cancelAll:yes');
  await panel('loans', 'save', { fields: { rate: '12', duration: '1d', max: '20000' } });
  await panel('raffle', 'save', { fields: { price: '250', pot: '1000', delay: '5m' } });
  await panel('raffle', 'reset');
  await panel('members', 'adjust', { admin: false });
  await panel('members', 'nope');

  // Economy rules: limits, robbing and a full reset
  await panel('economy', 'edit:economy');
  await panel('economy', 'edit:robbery');
  await panel('economy', 'save:economy', {
    fields: { start: '250', max: '0', minBet: '100', maxBet: '50' },
  });
  await panel('economy', 'save:economy', {
    fields: { start: '0', max: '0', minBet: '100', maxBet: '0' },
  });
  await panel('economy', 'save:robbery', {
    fields: { chance: '45', steal: '40', fine: '25', cooldown: '2h' },
  });
  await panel('economy', 'resetAll');
  await panel('economy', 'edit:crime');
  await panel('economy', 'save:crimeFine', { fields: { fineMode: 'fixed', min: '10', max: '5' } });
  await panel('economy', 'save:crimeFine', {
    fields: { fineMode: 'percent', min: '5', max: '150' },
  });
  await cmd('crime');
  clearCooldowns();
  await cmd('crime');

  // Blackjack: a whole hand with every button, and someone else's buttons
  accounts.credit(GUILD, alice.id, 5000, 'admin');
  clearCooldowns();
  blackjack.expire(Date.now() + blackjack.IDLE_MS * 2);
  await cmd('blackjack', { opts: { bet: '200' } });
  await cmd('blackjack', { opts: { bet: '200' } });
  await act('blackjack:hit:alice', { user: bob });
  await act('blackjack:hit:alice');
  await act('blackjack:double:alice');
  await act('blackjack:stand:alice');
  await act('blackjack:stand:alice');
  clearCooldowns();
  await cmd('blackjack', { opts: { bet: '200' } });
  await act('blackjack:double:alice');
  blackjack.expire(Date.now() + blackjack.IDLE_MS * 2);

  // Modules: a turned-off module answers with a notice, then comes back
  await panel('modules', 'toggle:games');
  clearCooldowns();
  await cmd('slots', { opts: { bet: '500' } });
  expect(harness.recorder.payloads.at(-1)?.text).toMatch(/turned off|desactivado/);
  await panel('modules', 'toggle:games');
  await panel('modules', 'toggle:nope');

  // Levels: every settings form, rewards, member XP, ranking and level-ups
  for (const category of [
    'levels',
    'levelCurve',
    'levelFormula',
    'levelMultipliers',
    'levelVoice',
    'levelAnnounce',
    'levelAnnounceRules',
    'levelFilters',
    'levelRoles',
    'levelLeaderboard',
  ]) {
    await panel('levels', `edit:${category}`);
  }
  await panel('levels', 'save:levels', {
    fields: { min: '400', max: '400', cooldown: '1m', coins: '250' },
  });
  await panel('levels', 'save:levelCurve', {
    fields: { curve: 'gentle', difficulty: '120', maxLevel: '300' },
  });
  await panel('levels', 'save:levelVoice', { fields: { enabled: true, xp: '8' } });
  await panel('levels', 'save:levelAnnounce', {
    fields: { mode: 'custom', channel: [], message: '', every: '1' },
  });
  await panel('levels', 'save:levelAnnounce', {
    fields: { mode: 'channel', channel: [], message: 'GG {user}, level {level}!', every: '1' },
  });
  await panel('levels', 'save:levelFilters', {
    fields: { channels: [], roles: [], rewardMode: 'replace' },
  });
  await panel('levels', 'addReward');
  await panel('levels', 'saveReward', { fields: { level: '2', role: [role] } });
  await panel('levels', 'saveReward', { fields: { level: 'x', role: [role] } });
  await panel('levels', 'adjust');
  await panel('levels', 'saveXp', { fields: { user: [bob], action: 'setLevel', amount: '3' } });
  await panel('levels', 'saveXp', { fields: { user: [bob], action: 'add', amount: '' } });
  levels.resetAll(GUILD);
  await onMessage.execute(harness.message(alice) as never);
  expect(harness.recorder.payloads.at(-1)?.text).toContain('GG <@alice>, level 2!');
  await cmd('rank');
  await cmd('rank', { opts: { user: bob } });
  for (const style of ['compact', 'embed', 'detailed', 'image'] as const) {
    settings.set(GUILD, 'levels.rankStyle', style);
    settings.set(
      GUILD,
      'levels.rankBackground',
      style === 'image' ? 'https://example.com/bg.png' : null,
    );
    await cmd('rank');
    await harness.userMenu(execute, 'View rank', { user: alice, target: alice, locale });
  }
  await cmd('calculate', { opts: { level: 50 } });
  await harness.userMenu(execute, 'View rank', { user: alice, target: bob, locale });
  await harness.userMenu(execute, 'View rank', { user: alice, target: alice, locale });
  await cmd('calculate', { opts: { level: 1, user: bob } });
  await act('rank:sync:alice');
  await act('rank:sync:alice', { user: bob });
  await panel('levels', 'addMessage');
  await panel('levels', 'saveMessage', { fields: { level: '10', message: 'Ten, {user}!' } });
  await panel('levels', 'saveMessage', { fields: { level: '0', message: 'x' } });
  await panel('levels', 'removeMessage', { values: ['10'] });
  await panel('levels', 'preview');
  await cmd('levels');
  await act('levels:page:alice:0');
  await act('levels:page:alice:0', { user: bob });
  await panel('levels', 'removeReward', { values: [role.id] });
  await panel('levels', 'resetAll');
  await panel('levels', 'resetAll:yes');
  await cmd('rank');
  settingsForm.resetCategory(GUILD, 'levelAnnounce');

  // Help: every page
  await cmd('help');
  await cmd('help', { opts: { command: 'lottery' } });
  await cmd('help', { opts: { command: 'config' }, admin: false });
  await harness.autocomplete(execute, 'help', { user: alice, focused: 'lo', locale });
  for (const section of ['economy', 'games', 'loans', 'shop', 'levels', 'admin', 'config']) {
    await act('help:section', { values: [section] });
  }
  for (const name of commandNames) await act('help:command', { values: [name] });
}

describe.each(['en-US', 'es-ES'])('every interaction in %s', (locale) => {
  it('renders without errors or untranslated texts', async () => {
    const before = harness.recorder.payloads.length;
    await suite(locale);
    expect(harness.recorder.errors).toEqual([]);
    expect(harness.recorder.payloads.length - before).toBeGreaterThan(150);
  });
});

describe('language', () => {
  it('a forced server language overrides the member language', async () => {
    await harness.component(execute, 'config:act:general:language', {
      user: alice,
      values: ['es'],
    });
    await harness.command(execute, 'balance', { user: alice, locale: 'en-US' });
    expect(harness.recorder.payloads.at(-1)?.text).toContain('Cartera');
    await harness.component(execute, 'config:act:general:language', {
      user: alice,
      values: ['auto'],
    });
    await harness.command(execute, 'balance', { user: alice, locale: 'en-US' });
    expect(harness.recorder.payloads.at(-1)?.text).toContain('Wallet');
  });

  it('non-admins cannot use the admin panel', async () => {
    await harness.component(execute, 'config:act:members:adjust', { user: bob, admin: false });
    expect(harness.recorder.payloads.at(-1)?.text).toMatch(
      /Only administrators|Solo los administradores/,
    );
  });
});
