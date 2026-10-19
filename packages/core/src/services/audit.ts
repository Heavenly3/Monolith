import { many, run } from '../db/database.ts';

export interface AuditEntry {
  id: number;
  guildId: string;
  actorId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: number;
}

/** Records an admin action (who changed what), shown in the dashboard. */
export function record(
  guildId: string,
  actorId: string,
  action: string,
  details?: Record<string, unknown>,
): void {
  run(
    'INSERT INTO audit_log (guild_id, actor_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)',
    guildId,
    actorId,
    action,
    details ? JSON.stringify(details) : null,
    Date.now(),
  );
}

export function recent(guildId: string, limit = 50): AuditEntry[] {
  return many<{
    id: number;
    guild_id: string;
    actor_id: string;
    action: string;
    details: string | null;
    created_at: number;
  }>('SELECT * FROM audit_log WHERE guild_id = ? ORDER BY id DESC LIMIT ?', guildId, limit).map(
    (row) => ({
      id: row.id,
      guildId: row.guild_id,
      actorId: row.actor_id,
      action: row.action,
      details: row.details ? (JSON.parse(row.details) as Record<string, unknown>) : null,
      createdAt: row.created_at,
    }),
  );
}
