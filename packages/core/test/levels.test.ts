import { beforeEach, describe, expect, it } from 'vitest';
import {
  accounts,
  levels,
  progressFor,
  settings,
  settingsForm,
  totalXpFor,
  xpToNext,
} from '../src/index.ts';
import { GUILD, alice, bob, freshDatabase } from './helpers.ts';

const STANDARD = { curve: 'standard', difficulty: 100, maxLevel: 500 } as const;
const chat = (now: number, roleIds: string[] = [], channelId = 'general') => ({
  channelId,
  roleIds,
  now,
});

beforeEach(() => {
  freshDatabase();
  // Fixed XP per message keeps the tests exact.
  settings.set(GUILD, 'levels.xp', { min: 20, max: 20 });
});

describe('level curve', () => {
  it('follows a·L² + b·L + c scaled by the difficulty', () => {
    expect(xpToNext(0, STANDARD)).toBe(100);
    expect(xpToNext(1, STANDARD)).toBe(155);
    expect(xpToNext(1, { ...STANDARD, difficulty: 200 })).toBe(310);
    expect(totalXpFor(2, STANDARD)).toBe(255);
  });

  it('turns total XP into a level and progress', () => {
    expect(progressFor(254, STANDARD)).toMatchObject({ level: 1, current: 154, needed: 155 });
    expect(progressFor(255, STANDARD)).toMatchObject({ level: 2, current: 0 });
    expect(progressFor(10 ** 9, { ...STANDARD, maxLevel: 5 }).level).toBe(5);
  });

  it('uses the custom formula and rounding', () => {
    const custom = {
      ...STANDARD,
      curve: 'custom',
      formula: { cubic: 1, quadratic: 0, linear: 0, constant: 7 },
    } as const;
    expect(xpToNext(2, custom)).toBe(15);
    expect(xpToNext(2, { ...custom, rounding: 10 })).toBe(20);
    expect(xpToNext(0, { ...custom, formula: { ...custom.formula, constant: 0 } })).toBe(1);
  });
});

describe('earning XP', () => {
  it('gives XP once per cooldown and counts every message', () => {
    expect(levels.awardMessage(GUILD, alice, chat(0))?.gained).toBe(20);
    expect(levels.awardMessage(GUILD, alice, chat(30_000))).toBeNull();
    expect(levels.awardMessage(GUILD, alice, chat(61_000))?.xp).toBe(40);
    expect(levels.getMember(GUILD, alice.id).messages).toBe(3);
  });

  it('skips ignored channels and roles', () => {
    settings.set(GUILD, 'levels.ignoredChannels', ['spam']);
    settings.set(GUILD, 'levels.ignoredRoles', ['muted']);
    expect(levels.awardMessage(GUILD, alice, chat(0, [], 'spam'))).toBeNull();
    expect(levels.awardMessage(GUILD, alice, chat(0, ['muted']))).toBeNull();
  });

  it('uses the best role multiplier times the channel multiplier', () => {
    levels.setMultiplier(GUILD, { type: 'role', id: 'booster', percent: 200 });
    levels.setMultiplier(GUILD, { type: 'role', id: 'vip', percent: 150 });
    levels.setMultiplier(GUILD, { type: 'channel', id: 'events', percent: 150 });
    expect(levels.awardMessage(GUILD, alice, chat(0, ['vip', 'booster'], 'events'))?.gained).toBe(
      60,
    );
  });

  it('combines multipliers the way the server chose', () => {
    levels.setMultiplier(GUILD, { type: 'role', id: 'booster', percent: 200 });
    levels.setMultiplier(GUILD, { type: 'role', id: 'vip', percent: 150 });
    levels.setMultiplier(GUILD, { type: 'channel', id: 'lounges', percent: 50 });
    const at = { channelId: 'bar', categoryId: 'lounges', roleIds: ['vip', 'booster'] };

    expect(levels.multiplierFor(GUILD, at)).toEqual({ role: 200, channel: 50, total: 100 });
    settings.set(GUILD, 'levels.roleMultiplierMode', 'highest');
    expect(levels.multiplierFor(GUILD, at).role).toBe(150);
    settings.set(GUILD, 'levels.roleMultiplierMode', 'add');
    expect(levels.multiplierFor(GUILD, at).role).toBe(250);
    settings.set(GUILD, 'levels.roleMultiplierMode', 'multiply');
    expect(levels.multiplierFor(GUILD, at).role).toBe(300);
    settings.set(GUILD, 'levels.channelMultiplierMode', 'channel');
    expect(levels.multiplierFor(GUILD, at).total).toBe(50);
    settings.set(GUILD, 'levels.channelMultiplierMode', 'add');
    expect(levels.multiplierFor(GUILD, at).total).toBe(250);
    expect(levels.multiplierFor(GUILD, { channelId: 'x', roleIds: [] })).toEqual({
      role: null,
      channel: null,
      total: 100,
    });
  });

  it('levels up and pays gold for each new level', () => {
    settings.set(GUILD, 'levels.coinsPerLevel', 500);
    settings.set(GUILD, 'levels.xp', { min: 300, max: 300 });
    const gain = levels.awardMessage(GUILD, bob, chat(0))!;
    expect(gain).toMatchObject({ before: 0, after: 2, levelsGained: 2, coins: 1000 });
    expect(accounts.findAccount(GUILD, bob.id)?.wallet).toBe(1000);
  });

  it('only gives voice XP when voice levelling is on', () => {
    expect(levels.awardVoice(GUILD, alice, 3, chat(0))).toBeNull();
    settings.set(GUILD, 'levels.voice', true);
    expect(levels.awardVoice(GUILD, alice, 3, chat(0))?.gained).toBe(15);
    expect(levels.getMember(GUILD, alice.id).voiceMinutes).toBe(3);
  });
});

describe('admin changes', () => {
  it('sets levels and XP without paying gold', () => {
    settings.set(GUILD, 'levels.coinsPerLevel', 500);
    expect(levels.adjust(GUILD, alice, 'setLevel', 2)).toMatchObject({
      xp: 255,
      after: 2,
      coins: 0,
    });
    expect(levels.adjust(GUILD, alice, 'remove', 1000).xp).toBe(0);
    expect(accounts.findAccount(GUILD, alice.id)).toBeNull();
  });

  it('ranks members and recalculates levels after the curve changes', () => {
    levels.adjust(GUILD, alice, 'setXp', 300);
    levels.adjust(GUILD, bob, 'setXp', 100);
    expect(levels.leaderboard(GUILD, 10).map((row) => row.userId)).toEqual([alice.id, bob.id]);
    expect(levels.rankOf(GUILD, bob.id)).toBe(2);

    settings.set(GUILD, 'levels.difficulty', 1000);
    levels.recalculate(GUILD);
    expect(levels.getMember(GUILD, alice.id).level).toBe(0);
  });
});

describe('role rewards', () => {
  beforeEach(() => {
    levels.addReward(GUILD, { level: 5, roleId: 'squire' });
    levels.addReward(GUILD, { level: 10, roleId: 'knight' });
  });

  it('stacks every earned role by default', () => {
    expect(levels.rewardRolesFor(GUILD, 12)).toEqual({ give: ['squire', 'knight'], take: [] });
    expect(levels.rewardRolesFor(GUILD, 7)).toEqual({ give: ['squire'], take: ['knight'] });
  });

  it('keeps only the highest role in replace mode', () => {
    settings.set(GUILD, 'levels.rewardMode', 'replace');
    expect(levels.rewardRolesFor(GUILD, 12)).toEqual({ give: ['knight'], take: ['squire'] });
  });

  it('honours keep and noSync rewards', () => {
    settings.set(GUILD, 'levels.rewardMode', 'replace');
    levels.addReward(GUILD, { level: 5, roleId: 'squire', keep: true });
    levels.addReward(GUILD, { level: 3, roleId: 'badge', noSync: true });
    expect(levels.rewardRolesFor(GUILD, 12)).toEqual({ give: ['squire', 'knight'], take: [] });
    expect(levels.roleChangesFor(GUILD, 2, 3)).toEqual({
      give: ['badge'],
      take: ['squire', 'knight'],
    });
    expect(levels.roleChangesFor(GUILD, 3, 3)?.give).toEqual([]);
  });

  it('follows the sync mode', () => {
    settings.set(GUILD, 'levels.syncMode', 'level');
    expect(levels.roleChangesFor(GUILD, 7, 7)).toBeNull();
    expect(levels.roleChangesFor(GUILD, 9, 10)).toEqual({ give: ['squire', 'knight'], take: [] });

    settings.set(GUILD, 'levels.syncMode', 'never');
    expect(levels.roleChangesFor(GUILD, 12, 4)).toBeNull();
    expect(levels.roleChangesFor(GUILD, 9, 10)).toEqual({ give: ['knight'], take: [] });
  });
});

describe('announcements', () => {
  it('follows every, until and rewards only', () => {
    settings.set(GUILD, 'levels.announceEvery', 5);
    expect(levels.shouldAnnounce(GUILD, 4, false)).toBe(false);
    expect(levels.shouldAnnounce(GUILD, 4, true)).toBe(true);
    expect(levels.shouldAnnounce(GUILD, 10, false)).toBe(true);
    settings.set(GUILD, 'levels.announceUntil', 20);
    expect(levels.shouldAnnounce(GUILD, 21, false)).toBe(true);
    settings.set(GUILD, 'levels.announceRewardsOnly', true);
    expect(levels.shouldAnnounce(GUILD, 10, false)).toBe(false);
    settings.set(GUILD, 'levels.announce', 'off');
    expect(levels.shouldAnnounce(GUILD, 10, true)).toBe(false);
  });

  it('keeps one special message per level', () => {
    expect(levels.setLevelMessage(GUILD, { level: 10, message: ' Ten! ' })).toBe('ok');
    expect(levels.setLevelMessage(GUILD, { level: 10, message: 'Again' })).toBe('ok');
    expect(levels.setLevelMessage(GUILD, { level: 0, message: 'x' })).toBe('invalid');
    expect(levels.levelMessageAt(GUILD, 10)).toBe('Again');
    expect(levels.removeLevelMessage(GUILD, 10)).toBe(true);
    expect(levels.levelMessageAt(GUILD, 10)).toBeNull();
  });
});

describe('settings forms', () => {
  it('validates the new field types', () => {
    expect(
      settingsForm.applyForm(
        GUILD,
        'levelAnnounce',
        (id) => ({ mode: 'custom', channel: '', message: '', every: '1' })[id],
      ),
    ).toEqual({ ok: false, reason: 'rule', messageKey: 'config.channelRequired' });

    const saved = settingsForm.applyForm(
      GUILD,
      'levelAnnounce',
      (id) =>
        ({ mode: 'custom', channel: '123456789012345678', message: 'GG {user}!', every: 5 })[id],
    );
    expect(saved.ok).toBe(true);
    expect(settings.get(GUILD, 'levels.announceMessage')).toBe('GG {user}!');

    expect(
      settingsForm.applyForm(GUILD, 'levelFilters', (id) =>
        id === 'roles' ? ['nope'] : undefined,
      ),
    ).toMatchObject({ ok: false, reason: 'invalid' });
    expect(
      settingsForm.applyForm(GUILD, 'modules', (id) => (id === 'games' ? false : undefined)),
    ).toMatchObject({ ok: true, changed: ['modules.games'] });
    expect(settings.get(GUILD, 'modules.economy')).toBe(true);
  });

  it('parses decimals and rejects an empty formula', () => {
    expect(
      settingsForm.applyForm(GUILD, 'levelFormula', (id) => (id === 'cubic' ? '0,5' : undefined)),
    ).toMatchObject({ ok: true });
    expect(settings.get(GUILD, 'levels.formula').cubic).toBe(0.5);
    expect(
      settingsForm.applyForm(GUILD, 'levelFormula', (id) => (id === 'rounding' ? undefined : '0')),
    ).toEqual({ ok: false, reason: 'rule', messageKey: 'config.formulaEmpty' });
  });
});
