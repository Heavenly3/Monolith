// Imports data from the original v1 bot (Sequelize, database.sqlite) into a
// server's economy. Safe to run more than once: existing rows are updated.
//   npm run migrate:legacy -- <serverId> [path/to/database.sqlite]
// Databases from v2 are upgraded automatically when the bot starts.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  closeDatabase,
  db,
  isSettingKey,
  logger,
  openDatabase,
  settings,
  transaction,
  type SettingKey,
  type SettingValues,
} from '@spacebet/core';
import { ROOT_DIR, env } from '../apps/bot/src/env.ts';

const log = logger.child('legacy');
const guildId = process.argv[2] ?? env.guildId;
const legacyPath = path.resolve(ROOT_DIR, process.argv[3] ?? 'database.sqlite');

if (!guildId) {
  log.error('Pass the server ID: npm run migrate:legacy -- <serverId> [file]');
  process.exit(1);
}
if (!fs.existsSync(legacyPath)) {
  log.error(`No legacy database found at ${legacyPath}`);
  process.exit(1);
}

type Row = Record<string, string | number | null>;
const legacy = new DatabaseSync(legacyPath, { readOnly: true });
const tables = new Set(
  (
    legacy.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
      name: string;
    }[]
  ).map((row) => row.name),
);
const rows = (table: string): Row[] =>
  tables.has(table) ? (legacy.prepare(`SELECT * FROM "${table}"`).all() as Row[]) : [];
const toInt = (value: unknown): number => Math.trunc(Number(value) || 0);

const SETTING_KEYS: Record<string, string> = {
  workMessages: 'work.messages',
  workRange: 'work.range',
  workCooldown: 'work.cooldown',
  collectCooldown: 'collect.cooldown',
  dailywheel_rewards: 'wheel.rewards',
  dailywheel_interval: 'wheel.cooldown',
};

openDatabase(env.databasePath);
const counts: Record<string, number> = {
  users: 0,
  loans: 0,
  roleRewards: 0,
  products: 0,
  inventory: 0,
  settings: 0,
};
const now = Date.now();

transaction(() => {
  const exec = (query: string, ...params: (string | number | null)[]) =>
    db()
      .prepare(query)
      .run(...params);

  for (const user of rows('Users')) {
    const userId = String(user.userId);
    exec(
      `INSERT INTO profiles (user_id, username) VALUES (?, ?)
       ON CONFLICT (user_id) DO UPDATE SET username = excluded.username`,
      userId,
      user.username ?? null,
    );
    exec(
      `INSERT INTO accounts (guild_id, user_id, wallet, bank) VALUES (?, ?, ?, ?)
       ON CONFLICT (guild_id, user_id) DO UPDATE SET wallet = excluded.wallet, bank = excluded.bank`,
      guildId,
      userId,
      toInt(user.wallet),
      toInt(user.bank),
    );
    counts.users!++;
    if (user.loanActive) {
      const principal = toInt(user.loanAmount);
      const rate = toInt(user.loanInterest);
      exec(
        `INSERT OR REPLACE INTO loans (guild_id, user_id, principal, interest_rate, amount_due, due_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        guildId,
        userId,
        principal,
        rate,
        principal + Math.ceil((principal * rate) / 100),
        user.loanDueDate ? new Date(String(user.loanDueDate)).getTime() : now,
        now,
      );
      counts.loans!++;
    }
  }

  for (const reward of rows('RoleCollects')) {
    if (toInt(reward.amount) <= 0) continue;
    exec(
      `INSERT INTO role_rewards (guild_id, role_id, amount) VALUES (?, ?, ?)
       ON CONFLICT (guild_id, role_id) DO UPDATE SET amount = excluded.amount`,
      guildId,
      String(reward.roleId),
      toInt(reward.amount),
    );
    counts.roleRewards!++;
  }

  const productIds = new Map<number, number>();
  for (const product of rows('Products')) {
    const name = String(product.name);
    const existing = db()
      .prepare('SELECT id FROM products WHERE guild_id = ? AND name = ?')
      .get(guildId, name) as { id: number } | undefined;
    const roleId = String(product.role ?? '').match(/\d{15,}/)?.[0] ?? null;
    const id =
      existing?.id ??
      Number(
        exec(
          `INSERT INTO products (guild_id, name, price, description, role_id, consumable) VALUES (?, ?, ?, ?, ?, ?)`,
          guildId,
          name,
          Math.max(0, toInt(product.price)),
          product.description ?? null,
          roleId,
          product.consumable ? 1 : 0,
        ).lastInsertRowid,
      );
    productIds.set(toInt(product.id), id);
    counts.products!++;
  }

  for (const item of rows('Inventories')) {
    const productId = productIds.get(toInt(item.productId));
    if (!productId || toInt(item.quantity) <= 0) continue;
    exec(
      `INSERT INTO inventory (guild_id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)
       ON CONFLICT (guild_id, user_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
      guildId,
      String(item.userId),
      productId,
      toInt(item.quantity),
    );
    counts.inventory!++;
  }
});

for (const row of rows('Settings')) {
  const key = SETTING_KEYS[String(row.key)];
  if (!key || !isSettingKey(key)) continue;
  try {
    let value = JSON.parse(String(row.value)) as unknown;
    if (key === 'wheel.rewards') {
      value = (value as { amount: number }[]).map((reward) => ({
        name: null,
        amount: Math.max(0, toInt(reward.amount)),
      }));
    }
    settings.set(guildId, key as SettingKey, value as SettingValues[SettingKey]);
    counts.settings!++;
  } catch {
    log.warn(`Skipped unreadable setting "${row.key}"`);
  }
}

legacy.close();
closeDatabase();
log.info(`Legacy data imported into ${guildId}:`, counts);
