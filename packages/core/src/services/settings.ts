import { many, one, run } from '../db/database.ts';
import { DEFAULTS, isSettingKey, type SettingKey, type SettingValues } from '../config/defaults.ts';

// guildId → key → value. Settings are read on almost every command.
const cache = new Map<string, Map<SettingKey, unknown>>();
function guildCache(guildId: string): Map<SettingKey, unknown> {
  let entry = cache.get(guildId);
  if (!entry) {
    entry = new Map();
    cache.set(guildId, entry);
  }
  return entry;
}

/** Current value of a setting for a server, falling back to its default. */
export function get<K extends SettingKey>(guildId: string, key: K): SettingValues[K] {
  const values = guildCache(guildId);
  if (!values.has(key)) {
    const row = one<{ value: string }>(
      'SELECT value FROM guild_settings WHERE guild_id = ? AND key = ?',
      guildId,
      key,
    );
    values.set(key, row ? JSON.parse(row.value) : DEFAULTS[key]);
  }
  return structuredClone(values.get(key)) as SettingValues[K];
}

export function set<K extends SettingKey>(guildId: string, key: K, value: SettingValues[K]): void {
  run(
    `INSERT INTO guild_settings (guild_id, key, value, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (guild_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    guildId,
    key,
    JSON.stringify(value),
    Date.now(),
  );
  guildCache(guildId).set(key, structuredClone(value));
}

export function reset(guildId: string, ...keys: SettingKey[]): void {
  for (const key of keys) {
    run('DELETE FROM guild_settings WHERE guild_id = ? AND key = ?', guildId, key);
    guildCache(guildId).delete(key);
  }
}

/** True when the server changed the setting from its default. */
export function isCustom(guildId: string, key: SettingKey): boolean {
  return Boolean(one('SELECT 1 FROM guild_settings WHERE guild_id = ? AND key = ?', guildId, key));
}

/** Every setting of a server (defaults included). */
export function getAll(guildId: string): SettingValues {
  const values = structuredClone(DEFAULTS);
  for (const row of many<{ key: string; value: string }>(
    'SELECT key, value FROM guild_settings WHERE guild_id = ?',
    guildId,
  )) {
    if (isSettingKey(row.key)) Object.assign(values, { [row.key]: JSON.parse(row.value) });
  }
  return values;
}

/** Drops cached values (after data is moved between servers). */
export function clearCache(): void {
  cache.clear();
}
