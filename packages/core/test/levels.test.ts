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
});
