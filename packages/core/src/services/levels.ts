// Experience and levels of members. Discord-free: the bot passes the channel
// and roles of a message, and applies the role changes this returns.
import { levelFor, progressFor, totalXpFor, type CurveSettings } from '../config/levels.ts';
import type { LevelReward, XpMultiplier } from '../config/defaults.ts';
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
  roleIds: readonly string[];
  now?: number;
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

/** Level, XP inside the level and XP needed, for a rank card. */
export function progressOf(guildId: string, userId: string) {
  const member = getMember(guildId, userId);
  return { ...member, ...progressFor(member.xp, curveOf(guildId)) };
}

// ── Earning XP ──────────────────────────────────────────────────────────────

/** Multiplier for a member: their best role multiplier times the channel's (percent). */
export function multiplierFor(guildId: string, { channelId, roleIds }: ActivityContext): number {
  const multipliers = settings.get(guildId, 'levels.multipliers');
  const roles = new Set(roleIds);
  const rolePercents = multipliers
    .filter((m) => m.type === 'role' && roles.has(m.id))
    .map((m) => m.percent);
  const role = rolePercents.length ? Math.max(...rolePercents) : 100;
  const channel =
    multipliers.find((m) => m.type === 'channel' && m.id === channelId)?.percent ?? 100;
  return (role * channel) / 100;
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
  const amount = Math.round((randomBetween(min, max) * multiplierFor(guildId, context)) / 100);
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
  const amount = Math.round((perMinute * minutes * multiplierFor(guildId, context)) / 100);
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

/**
 * Reward roles a member at `level` should have and should not have. With
 * "stack" they keep every role earned; with "replace" only the highest.
 */
export function rewardRolesFor(guildId: string, level: number): { give: string[]; take: string[] } {
  const all = rewards(guildId);
  const earned = all.filter((r) => r.level <= level);
  const top = earned.length ? Math.max(...earned.map((r) => r.level)) : -1;
  const keep =
    settings.get(guildId, 'levels.rewardMode') === 'replace'
      ? earned.filter((r) => r.level === top)
      : earned;
  const give = new Set(keep.map((r) => r.roleId));
  const take = all.map((r) => r.roleId).filter((id) => !give.has(id));
  return { give: [...give], take: [...new Set(take)] };
}

/** The reward role unlocked exactly at `level`, if any (for announcements). */
export const rewardAt = (guildId: string, level: number): LevelReward | undefined =>
  rewards(guildId).find((r) => r.level === level);

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
