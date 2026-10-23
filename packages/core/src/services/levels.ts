// Experience and levels of members. Discord-free: the bot passes the channel
// and roles of a message, and applies the role changes this returns.
import { levelFor, progressFor, totalXpFor, type CurveSettings } from '../config/levels.ts';
import type { LevelMessage, LevelReward, XpMultiplier } from '../config/defaults.ts';
import { many, one, run, transaction } from '../db/database.ts';
import type { UserRef } from '../types.ts';
import { randomBetween } from '../utils/random.ts';
import * as accounts from './accounts.ts';
import * as settings from './settings.ts';

export interface MemberLevel {
  userId: string;
  xp: number;
  level: number;
  messages: number;
  voiceMinutes: number;
}

export interface LevelRow extends MemberLevel {
  username: string | null;
}

/** Result of giving XP. `levelsGained` > 0 means the member levelled up. */
export interface XpGain {
  gained: number;
  xp: number;
  before: number;
  after: number;
  levelsGained: number;
  /** Credits paid for the new levels (levels.coinsPerLevel). */
  coins: number;
}

export interface ActivityContext {
  channelId: string;
  /** Category of the channel, for category multipliers. */
  categoryId?: string | null;
  /** The member's roles, highest first (the "highest" multiplier mode relies on it). */
  roleIds: readonly string[];
  now?: number;
}

/** Multipliers in percent; null when nothing applies. */
export interface MultiplierBreakdown {
  role: number | null;
  channel: number | null;
  total: number;
}

interface Row {
  user_id: string;
  xp: number;
  level: number;
  messages: number;
  voice_minutes: number;
  last_message_at: number;
  username?: string | null;
}

const toMember = (row: Row): MemberLevel => ({
  userId: row.user_id,
  xp: row.xp,
  level: row.level,
  messages: row.messages,
  voiceMinutes: row.voice_minutes,
});

export function curveOf(guildId: string): CurveSettings {
  return {
    curve: settings.get(guildId, 'levels.curve'),
    difficulty: settings.get(guildId, 'levels.difficulty'),
    maxLevel: settings.get(guildId, 'levels.maxLevel'),
    formula: settings.get(guildId, 'levels.formula'),
    rounding: settings.get(guildId, 'levels.rounding'),
  };
}

function row(guildId: string, userId: string): Row | undefined {
  return one<Row>(
    'SELECT * FROM member_levels WHERE guild_id = ? AND user_id = ?',
    guildId,
    userId,
  );
}

export function getMember(guildId: string, userId: string): MemberLevel {
  const found = row(guildId, userId);
  return found ? toMember(found) : { userId, xp: 0, level: 0, messages: 0, voiceMinutes: 0 };
}

/** Milliseconds before the member's next message gives XP (0 = now). */
export function cooldownLeft(guildId: string, userId: string, now = Date.now()): number {
  const last = row(guildId, userId)?.last_message_at ?? 0;
  if (!last) return 0;
  return Math.max(0, last + settings.get(guildId, 'levels.cooldown') * 1000 - now);
}

/**
 * Messages still needed to reach `targetXp`, counting the average XP of a
 * message times the member's multiplier. Null when messages give no XP.
 */
export function messagesUntil(guildId: string, missingXp: number, multiplier = 100): number | null {
  const { min, max } = settings.get(guildId, 'levels.xp');
  const perMessage = ((min + max) / 2) * (multiplier / 100);
  if (perMessage <= 0) return null;
  return Math.ceil(Math.max(0, missingXp) / perMessage);
}

/** Level, XP inside the level and XP needed, for a rank card. */
export function progressOf(guildId: string, userId: string) {
  const member = getMember(guildId, userId);
  return { ...member, ...progressFor(member.xp, curveOf(guildId)) };
}

// ── Earning XP ──────────────────────────────────────────────────────────────

const sumPercents = (percents: number[]): number =>
  Math.max(0, 100 + percents.reduce((sum, percent) => sum + percent - 100, 0));

/** Role multipliers combined the way the server chose. */
function roleMultiplier(guildId: string, roleIds: readonly string[]): number | null {
  const byRole = new Map(
    settings
      .get(guildId, 'levels.multipliers')
      .filter((m) => m.type === 'role')
      .map((m) => [m.id, m.percent]),
  );
  const percents = roleIds.filter((id) => byRole.has(id)).map((id) => byRole.get(id)!);
  if (!percents.length) return null;
  switch (settings.get(guildId, 'levels.roleMultiplierMode')) {
    case 'largest':
      return Math.max(...percents);
    case 'smallest':
      return Math.min(...percents);
    case 'highest':
      return percents[0]!;
    case 'add':
      return sumPercents(percents);
    case 'multiply':
      return percents.reduce((total, percent) => (total * percent) / 100, 100);
  }
}

/** Multiplier of the channel, or of its category when the channel has none. */
function channelMultiplier(guildId: string, { channelId, categoryId }: ActivityContext) {
  const channels = settings.get(guildId, 'levels.multipliers').filter((m) => m.type === 'channel');
  return (
    channels.find((m) => m.id === channelId)?.percent ??
    (categoryId ? channels.find((m) => m.id === categoryId)?.percent : undefined) ??
    null
  );
}

/** Multipliers of a member in a channel (percent), and how they combine. */
export function multiplierFor(guildId: string, context: ActivityContext): MultiplierBreakdown {
  const role = roleMultiplier(guildId, context.roleIds);
  const channel = channelMultiplier(guildId, context);
  const present = [role, channel].filter((value) => value !== null);
  const total = (() => {
    switch (settings.get(guildId, 'levels.channelMultiplierMode')) {
      case 'multiply':
        return ((role ?? 100) * (channel ?? 100)) / 100;
      case 'add':
        return sumPercents(present);
      case 'largest':
        return present.length ? Math.max(...present) : 100;
      case 'channel':
        return channel ?? role ?? 100;
      case 'role':
        return role ?? channel ?? 100;
    }
  })();
  return { role, channel, total: Math.round(total * 100) / 100 };
}

/** True when the channel or one of the roles is excluded from XP. */
export function isIgnored(guildId: string, { channelId, roleIds }: ActivityContext): boolean {
  if (settings.get(guildId, 'levels.ignoredChannels').includes(channelId)) return true;
  const ignoredRoles = new Set(settings.get(guildId, 'levels.ignoredRoles'));
  return roleIds.some((id) => ignoredRoles.has(id));
}

/** Adds (or removes, with a negative amount) XP and, if asked, pays credits for new levels. */
function changeXp(
  guildId: string,
  user: UserRef,
  amount: number,
  { payCoins = true, now = Date.now() }: { payCoins?: boolean; now?: number } = {},
): XpGain {
  return transaction(() => {
    const curve = curveOf(guildId);
    const before = getMember(guildId, user.id);
    const xp = Math.max(0, before.xp + amount);
    const level = levelFor(xp, curve);
    run(
      `INSERT INTO member_levels (guild_id, user_id, xp, level, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level,
         updated_at = excluded.updated_at`,
      guildId,
      user.id,
      xp,
      level,
      now,
    );

    const levelsGained = Math.max(0, level - before.level);
    const coins = payCoins ? levelsGained * settings.get(guildId, 'levels.coinsPerLevel') : 0;
    if (coins > 0) {
      accounts.getAccount(guildId, user);
      accounts.credit(guildId, user.id, coins, 'level');
    }
    return { gained: xp - before.xp, xp, before: before.level, after: level, levelsGained, coins };
  });
}

/**
 * XP for a message: a random amount in the configured range, times the
 * multipliers, once per cooldown. Null when the message earns nothing.
 */
export function awardMessage(
  guildId: string,
  user: UserRef,
  context: ActivityContext,
): XpGain | null {
  const now = context.now ?? Date.now();
  if (isIgnored(guildId, context)) return null;

  const current = row(guildId, user.id);
  run(
    `INSERT INTO member_levels (guild_id, user_id, messages) VALUES (?, ?, 1)
     ON CONFLICT (guild_id, user_id) DO UPDATE SET messages = messages + 1`,
    guildId,
    user.id,
  );
  const cooldown = settings.get(guildId, 'levels.cooldown') * 1000;
  if (current && now - current.last_message_at < cooldown) return null;

  run(
    'UPDATE member_levels SET last_message_at = ? WHERE guild_id = ? AND user_id = ?',
    now,
    guildId,
    user.id,
  );
  accounts.rememberProfile(user);
  const { min, max } = settings.get(guildId, 'levels.xp');
  const amount = Math.round(
    (randomBetween(min, max) * multiplierFor(guildId, context).total) / 100,
  );
  return changeXp(guildId, user, amount, { now });
}

/** XP for minutes spent talking in a voice channel. */
export function awardVoice(
  guildId: string,
  user: UserRef,
  minutes: number,
  context: ActivityContext,
): XpGain | null {
  if (!settings.get(guildId, 'levels.voice') || isIgnored(guildId, context)) return null;
  run(
    `INSERT INTO member_levels (guild_id, user_id, voice_minutes) VALUES (?, ?, ?)
     ON CONFLICT (guild_id, user_id) DO UPDATE SET voice_minutes = voice_minutes + excluded.voice_minutes`,
    guildId,
    user.id,
    minutes,
  );
  accounts.rememberProfile(user);
  const perMinute = settings.get(guildId, 'levels.voiceXp');
  const amount = Math.round((perMinute * minutes * multiplierFor(guildId, context).total) / 100);
  return changeXp(guildId, user, amount);
}

// ── Admin changes ───────────────────────────────────────────────────────────

export const XP_ACTIONS = ['add', 'remove', 'setXp', 'setLevel', 'reset'] as const;
export type XpAction = (typeof XP_ACTIONS)[number];

/** Admin change of a member's experience. Credits are only paid for levels earned by chatting. */
export function adjust(guildId: string, user: UserRef, action: XpAction, amount: number): XpGain {
  const current = getMember(guildId, user.id).xp;
  const curve = curveOf(guildId);
  const target = {
    add: current + amount,
    remove: current - amount,
    setXp: amount,
    setLevel: totalXpFor(Math.min(amount, curve.maxLevel), curve),
    reset: 0,
  }[action];
  accounts.rememberProfile(user);
  return changeXp(guildId, user, target - current, { payCoins: false });
}

/** Removes every member's experience in a server. Returns how many were reset. */
export function resetAll(guildId: string): number {
  return run('DELETE FROM member_levels WHERE guild_id = ?', guildId).changes;
}

/** Recomputes stored levels after the curve changes. */
export function recalculate(guildId: string): void {
  const curve = curveOf(guildId);
  transaction(() => {
    for (const member of many<Row>('SELECT * FROM member_levels WHERE guild_id = ?', guildId)) {
      const level = levelFor(member.xp, curve);
      if (level !== member.level) {
        run(
          'UPDATE member_levels SET level = ? WHERE guild_id = ? AND user_id = ?',
          level,
          guildId,
          member.user_id,
        );
      }
    }
  });
}

// ── Backups ─────────────────────────────────────────────────────────────────

export interface XpRecord {
  userId: string;
  xp: number;
  messages?: number;
  voiceMinutes?: number;
}

export const IMPORT_MODES = ['replace', 'add', 'highest'] as const;
export type ImportMode = (typeof IMPORT_MODES)[number];
export const MAX_IMPORT = 100_000;

/** Every member with experience, most first, for a backup or another bot. */
export function exportAll(guildId: string): (LevelRow & { rank: number })[] {
  return leaderboard(guildId, MAX_IMPORT).map((row, index) => ({ ...row, rank: index + 1 }));
}

/**
 * Loads experience from a backup. "replace" wipes the server first, "add"
 * sums it to the current XP and "highest" keeps whichever is larger. Levels
 * are recomputed with the current curve; no credits are paid.
 */
export function importXp(guildId: string, records: XpRecord[], mode: ImportMode): number {
  const valid = records.filter(
    (r) => /^\d{17,20}$/.test(r.userId) && Number.isSafeInteger(r.xp) && r.xp >= 0,
  );
  const curve = curveOf(guildId);
  transaction(() => {
    if (mode === 'replace') resetAll(guildId);
    for (const record of valid) {
      const current = getMember(guildId, record.userId);
      const xp =
        mode === 'add'
          ? current.xp + record.xp
          : mode === 'highest'
            ? Math.max(current.xp, record.xp)
            : record.xp;
      run(
        `INSERT INTO member_levels (guild_id, user_id, xp, level, messages, voice_minutes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = excluded.xp, level = excluded.level,
           messages = MAX(messages, excluded.messages),
           voice_minutes = MAX(voice_minutes, excluded.voice_minutes),
           updated_at = excluded.updated_at`,
        guildId,
        record.userId,
        xp,
        levelFor(xp, curve),
        Math.max(0, Math.floor(record.messages ?? 0)),
        Math.max(0, Math.floor(record.voiceMinutes ?? 0)),
        Date.now(),
      );
    }
  });
  return valid.length;
}

// ── Rankings ────────────────────────────────────────────────────────────────

export function leaderboard(guildId: string, limit: number, offset = 0): LevelRow[] {
  return many<Row>(
    `SELECT l.*, p.username FROM member_levels l
     LEFT JOIN profiles p ON p.user_id = l.user_id
     WHERE l.guild_id = ? AND l.xp > 0
     ORDER BY l.xp DESC, l.user_id LIMIT ? OFFSET ?`,
    guildId,
    limit,
    offset,
  ).map((r) => ({ ...toMember(r), username: r.username ?? null }));
}

export function leaderboardSize(guildId: string): number {
  return (
    one<{ total: number }>(
      'SELECT COUNT(*) AS total FROM member_levels WHERE guild_id = ? AND xp > 0',
      guildId,
    )?.total ?? 0
  );
}

/** Position on the level ranking, or null without XP. */
export function rankOf(guildId: string, userId: string): number | null {
  const { xp } = getMember(guildId, userId);
  if (xp <= 0) return null;
  return (
    one<{ rank: number }>(
      'SELECT COUNT(*) + 1 AS rank FROM member_levels WHERE guild_id = ? AND xp > ?',
      guildId,
      xp,
    )?.rank ?? null
  );
}

export function stats(guildId: string): { members: number; totalXp: number; topLevel: number } {
  return (
    one<{ members: number; totalXp: number; topLevel: number }>(
      `SELECT COUNT(*) AS members, COALESCE(SUM(xp), 0) AS totalXp, COALESCE(MAX(level), 0) AS topLevel
       FROM member_levels WHERE guild_id = ? AND xp > 0`,
      guildId,
    ) ?? { members: 0, totalXp: 0, topLevel: 0 }
  );
}

// ── Role rewards ────────────────────────────────────────────────────────────

export const MAX_REWARDS = 50;
export const MAX_MULTIPLIERS = 50;

export function rewards(guildId: string): LevelReward[] {
  return settings
    .get(guildId, 'levels.rewards')
    .sort((a, b) => a.level - b.level || a.roleId.localeCompare(b.roleId));
}

export function addReward(guildId: string, reward: LevelReward): 'ok' | 'full' {
  const list = rewards(guildId).filter((r) => r.roleId !== reward.roleId);
  if (list.length >= MAX_REWARDS) return 'full';
  settings.set(guildId, 'levels.rewards', [...list, reward]);
  return 'ok';
}

export function removeReward(guildId: string, roleId: string): boolean {
  const list = rewards(guildId);
  const kept = list.filter((r) => r.roleId !== roleId);
  if (kept.length === list.length) return false;
  settings.set(guildId, 'levels.rewards', kept);
  return true;
}

export interface RoleChanges {
  give: string[];
  take: string[];
}

/**
 * Reward roles a member at `level` should have and should not have. With
 * "stack" they keep every role earned; with "replace" only the highest (and
 * the ones marked "keep"). Rewards marked "noSync" are left out of both.
 */
export function rewardRolesFor(guildId: string, level: number): RoleChanges {
  const all = rewards(guildId).filter((r) => !r.noSync);
  const earned = all.filter((r) => r.level <= level);
  const top = earned.length ? Math.max(...earned.map((r) => r.level)) : -1;
  const kept =
    settings.get(guildId, 'levels.rewardMode') === 'replace'
      ? earned.filter((r) => r.level === top || r.keep)
      : earned;
  const give = new Set(kept.map((r) => r.roleId));
  const take = all.map((r) => r.roleId).filter((id) => !give.has(id));
  return { give: [...give], take: [...new Set(take)] };
}

/**
 * Role changes after a member went from level `before` to `after`, following
 * the server's sync mode. Null when roles should not be touched.
 */
export function roleChangesFor(guildId: string, before: number, after: number): RoleChanges | null {
  const mode = settings.get(guildId, 'levels.syncMode');
  if (mode === 'level' && before === after) return null;
  if (mode === 'never' && after <= before) return null;

  const target = rewardRolesFor(guildId, after);
  const reached = rewards(guildId).filter((r) => r.level > before && r.level <= after);
  const reachedOnce = reached.filter((r) => r.noSync).map((r) => r.roleId);
  if (mode !== 'never') return { give: [...target.give, ...reachedOnce], take: target.take };

  // Never sync: only add what this level-up reached; "replace" still swaps lower roles out.
  const goal = new Set(target.give);
  return {
    give: [...reached.filter((r) => goal.has(r.roleId)).map((r) => r.roleId), ...reachedOnce],
    take: settings.get(guildId, 'levels.rewardMode') === 'replace' ? target.take : [],
  };
}

/** The reward role unlocked exactly at `level`, if any (for announcements). */
export const rewardAt = (guildId: string, level: number): LevelReward | undefined =>
  rewards(guildId).find((r) => r.level === level);

// ── Announcements ───────────────────────────────────────────────────────────

/** Whether reaching `level` is announced, following the server's rules. */
export function shouldAnnounce(guildId: string, level: number, givesReward: boolean): boolean {
  if (settings.get(guildId, 'levels.announce') === 'off') return false;
  if (givesReward) return true;
  if (settings.get(guildId, 'levels.announceRewardsOnly')) return false;
  const until = settings.get(guildId, 'levels.announceUntil');
  if (until > 0 && level > until) return true;
  return level % settings.get(guildId, 'levels.announceEvery') === 0;
}

export const MAX_LEVEL_MESSAGES = 50;
export const LEVEL_MESSAGE_LENGTH = 500;

export const levelMessages = (guildId: string): LevelMessage[] =>
  settings.get(guildId, 'levels.levelMessages').sort((a, b) => a.level - b.level);

/** Adds or replaces the special message of one level. */
export function setLevelMessage(guildId: string, entry: LevelMessage): 'ok' | 'full' | 'invalid' {
  const message = entry.message.trim();
  if (!message || message.length > LEVEL_MESSAGE_LENGTH) return 'invalid';
  if (!Number.isInteger(entry.level) || entry.level < 1 || entry.level > 1000) return 'invalid';
  const list = levelMessages(guildId).filter((m) => m.level !== entry.level);
  if (list.length >= MAX_LEVEL_MESSAGES) return 'full';
  settings.set(guildId, 'levels.levelMessages', [...list, { level: entry.level, message }]);
  return 'ok';
}

export function removeLevelMessage(guildId: string, level: number): boolean {
  const list = levelMessages(guildId);
  const kept = list.filter((m) => m.level !== level);
  if (kept.length === list.length) return false;
  settings.set(guildId, 'levels.levelMessages', kept);
  return true;
}

export const levelMessageAt = (guildId: string, level: number): string | null =>
  levelMessages(guildId).find((m) => m.level === level)?.message ?? null;

// ── Multipliers ─────────────────────────────────────────────────────────────

export function multipliers(guildId: string): XpMultiplier[] {
  return settings.get(guildId, 'levels.multipliers');
}

export function setMultiplier(guildId: string, multiplier: XpMultiplier): 'ok' | 'full' {
  const list = multipliers(guildId).filter(
    (m) => !(m.type === multiplier.type && m.id === multiplier.id),
  );
  if (list.length >= MAX_MULTIPLIERS) return 'full';
  settings.set(guildId, 'levels.multipliers', [...list, multiplier]);
  return 'ok';
}

export function removeMultiplier(guildId: string, type: XpMultiplier['type'], id: string): boolean {
  const list = multipliers(guildId);
  const kept = list.filter((m) => !(m.type === type && m.id === id));
  if (kept.length === list.length) return false;
  settings.set(guildId, 'levels.multipliers', kept);
  return true;
}
