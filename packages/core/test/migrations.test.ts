import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LEGACY_GUILD,
  accounts,
  claimLegacyData,
  closeDatabase,
  openDatabase,
  settings,
  shop,
} from '../src/index.ts';

let dir: string | null = null;
afterEach(() => {
  closeDatabase();
  settings.clearCache();
  if (dir) fs.rmSync(dir, { recursive: true, force: true });
  dir = null;
});

/** Builds a v2 database (single economy) the way the previous release left it. */
function createV2Database(file: string): void {
  const v2 = new DatabaseSync(file);
  v2.exec(`
    CREATE TABLE users (user_id TEXT PRIMARY KEY, username TEXT, wallet INTEGER NOT NULL DEFAULT 0,
      bank INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0, locale TEXT);
    CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE cooldowns (user_id TEXT NOT NULL, name TEXT NOT NULL, expires_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, name));
    CREATE TABLE role_rewards (role_id TEXT PRIMARY KEY, amount INTEGER NOT NULL);
    CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      price INTEGER NOT NULL, description TEXT, role_id TEXT, consumable INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE inventory (user_id TEXT NOT NULL, product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL, PRIMARY KEY (user_id, product_id));
    CREATE TABLE loans (user_id TEXT PRIMARY KEY, principal INTEGER NOT NULL, interest_rate INTEGER NOT NULL,
      amount_due INTEGER NOT NULL, due_at INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE raffle_tickets (user_id TEXT NOT NULL, number INTEGER NOT NULL, created_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, number));
    CREATE TABLE raffle_state (id INTEGER PRIMARY KEY CHECK (id = 1), pot INTEGER NOT NULL, draw_at INTEGER, channel_id TEXT);
    INSERT INTO users (user_id, username, wallet, bank, locale) VALUES ('u1', 'ana', 1500, 300, 'es-ES');
    INSERT INTO settings VALUES ('work.cooldown', '120');
    INSERT INTO products (id, name, price, consumable) VALUES (5, 'Potion', 50, 1);
    INSERT INTO inventory VALUES ('u1', 5, 2);
    INSERT INTO loans VALUES ('u1', 1000, 10, 1100, 99999999999999, 0);
    INSERT INTO raffle_state VALUES (1, 800, NULL, NULL);
    PRAGMA user_version = 2;
  `);
  v2.close();
}

describe('migration to per-server economies', () => {
  it('keeps every balance, item, loan and setting', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spacebet-'));
    const file = path.join(dir, 'v2.db');
    createV2Database(file);

    openDatabase(file);
    expect(accounts.findAccount(LEGACY_GUILD, 'u1')).toMatchObject({ wallet: 1500, bank: 300 });
    expect(accounts.getProfile('u1')).toEqual({ username: 'ana', locale: 'es-ES' });

    expect(claimLegacyData('real-guild')).toBe(true);
    settings.clearCache();
    expect(claimLegacyData('real-guild')).toBe(false);

    expect(accounts.findAccount('real-guild', 'u1')).toMatchObject({ wallet: 1500, bank: 300 });
    expect(settings.get('real-guild', 'work.cooldown')).toBe(120);
    expect(shop.getInventory('real-guild', 'u1')).toMatchObject([
      { id: 5, name: 'Potion', quantity: 2 },
    ]);
    expect(accounts.findAccount(LEGACY_GUILD, 'u1')).toBeNull();
  });

  it('creates a fresh database from scratch', () => {
    openDatabase(':memory:');
    expect(accounts.getAccount('g', { id: 'x', username: 'x' })).toMatchObject({ wallet: 0 });
  });
});
