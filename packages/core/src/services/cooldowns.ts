import { one, run } from '../db/database.ts';
import * as settings from './settings.ts';
import type { CooldownName } from '../config/games.ts';

/**
 * Milliseconds left before a member can use `name` again (0 when ready).
 * Cooldowns live in the database, so they survive restarts.
 */
export function remaining(guildId: string, userId: string, name: CooldownName): number {
  const row = one<{ expires_at: number }>(
    'SELECT expires_at FROM cooldowns WHERE guild_id = ? AND user_id = ? AND name = ?',
    guildId,
    userId,
    name,
  );
  return row ? Math.max(0, row.expires_at - Date.now()) : 0;
}

/** Starts a cooldown and returns when it ends (ms timestamp). */
export function start(
  guildId: string,
  userId: string,
  name: CooldownName,
  seconds: number,
): number {
  const expiresAt = Date.now() + seconds * 1000;
  run(
    `INSERT INTO cooldowns (guild_id, user_id, name, expires_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (guild_id, user_id, name) DO UPDATE SET expires_at = excluded.expires_at`,
    guildId,
    userId,
    name,
    expiresAt,
  );
  return expiresAt;
}

/** Starts the cooldown configured in the `<name>.cooldown` setting. */
export function startConfigured(guildId: string, userId: string, name: CooldownName): number {
  return start(guildId, userId, name, settings.get(guildId, `${name}.cooldown`));
}

export function clear(guildId: string, userId: string, name: CooldownName): void {
  run(
    'DELETE FROM cooldowns WHERE guild_id = ? AND user_id = ? AND name = ?',
    guildId,
    userId,
    name,
  );
}

export function purgeExpired(): number {
  return run('DELETE FROM cooldowns WHERE expires_at <= ?', Date.now()).changes;
}
