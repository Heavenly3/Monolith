// Login sessions of the web dashboard. The browser keeps a random token in a
// cookie; only its SHA-256 hash is stored, so a leaked database cannot be
// used to log in.
import { createHash, randomBytes } from 'node:crypto';
import { one, run } from '../db/database.ts';

export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface WebSession {
  userId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  /** Cached guild list from Discord and when it was fetched. */
  guilds: unknown;
  guildsAt: number | null;
  expiresAt: number;
}

interface SessionRow {
  user_id: string;
  username: string;
  avatar: string | null;
  access_token: string;
  guilds: string | null;
  guilds_at: number | null;
  expires_at: number;
}

const hash = (token: string): string => createHash('sha256').update(token).digest('hex');

/** Creates a session and returns the token for the cookie. */
export function create(
  user: { id: string; username: string; avatar: string | null },
  accessToken: string,
  now = Date.now(),
): string {
  const token = randomBytes(32).toString('base64url');
  run(
    `INSERT INTO web_sessions (id, user_id, username, avatar, access_token, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    hash(token),
    user.id,
    user.username,
    user.avatar,
    accessToken,
    now + SESSION_TTL,
  );
  return token;
}

export function find(token: string, now = Date.now()): WebSession | null {
  const row = one<SessionRow>('SELECT * FROM web_sessions WHERE id = ?', hash(token));
  if (!row) return null;
  if (row.expires_at <= now) {
    destroy(token);
    return null;
  }
  return {
    userId: row.user_id,
    username: row.username,
    avatar: row.avatar,
    accessToken: row.access_token,
    guilds: row.guilds ? JSON.parse(row.guilds) : null,
    guildsAt: row.guilds_at,
    expiresAt: row.expires_at,
  };
}

export function cacheGuilds(token: string, guilds: unknown, now = Date.now()): void {
  run(
    'UPDATE web_sessions SET guilds = ?, guilds_at = ? WHERE id = ?',
    JSON.stringify(guilds),
    now,
    hash(token),
  );
}

export function destroy(token: string): void {
  run('DELETE FROM web_sessions WHERE id = ?', hash(token));
}

/** Removes expired sessions; returns how many. */
export function prune(now = Date.now()): number {
  return run('DELETE FROM web_sessions WHERE expires_at <= ?', now).changes;
}
