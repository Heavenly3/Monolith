import { many, run } from '../db/database.ts';

export interface RoleReward {
  roleId: string;
  amount: number;
}

export function list(guildId: string): RoleReward[] {
  return many<{ role_id: string; amount: number }>(
    'SELECT role_id, amount FROM role_rewards WHERE guild_id = ? ORDER BY amount DESC',
    guildId,
  ).map((row) => ({ roleId: row.role_id, amount: row.amount }));
}

export function set(guildId: string, roleId: string, amount: number): void {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new RangeError(`Invalid amount ${amount}`);
  run(
    `INSERT INTO role_rewards (guild_id, role_id, amount) VALUES (?, ?, ?)
     ON CONFLICT (guild_id, role_id) DO UPDATE SET amount = excluded.amount`,
    guildId,
    roleId,
    amount,
  );
}

export function remove(guildId: string, roleId: string): boolean {
  return (
    run('DELETE FROM role_rewards WHERE guild_id = ? AND role_id = ?', guildId, roleId).changes > 0
  );
}

export function clear(guildId: string): number {
  return run('DELETE FROM role_rewards WHERE guild_id = ?', guildId).changes;
}

/** Rewards that apply to a member, given the IDs of their roles. */
export function forRoles(guildId: string, roleIds: Iterable<string>): RoleReward[] {
  const ids = new Set(roleIds);
  return list(guildId).filter((reward) => ids.has(reward.roleId));
}
