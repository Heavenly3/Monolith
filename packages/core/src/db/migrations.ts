// Each entry upgrades the schema by one version (stored in PRAGMA user_version).
// Never edit a migration that has shipped — append a new one instead.

/** Owner of data created before economies were split per server. */
export const LEGACY_GUILD = 'legacy';

const NOW = '(unixepoch() * 1000)';

export const MIGRATIONS: readonly string[] = [
  // 1 — initial schema (single economy)
  `
  CREATE TABLE users (
    user_id    TEXT PRIMARY KEY,
    username   TEXT,
    wallet     INTEGER NOT NULL DEFAULT 0,
    bank       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    updated_at INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE cooldowns (
    user_id TEXT NOT NULL, name TEXT NOT NULL, expires_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, name)
  );
  CREATE TABLE role_rewards (role_id TEXT PRIMARY KEY, amount INTEGER NOT NULL CHECK (amount > 0));
  CREATE TABLE products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
    price       INTEGER NOT NULL CHECK (price >= 0),
    description TEXT,
    role_id     TEXT,
    consumable  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE inventory (
    user_id    TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (user_id, product_id)
  );
  CREATE TABLE loans (
    user_id TEXT PRIMARY KEY, principal INTEGER NOT NULL, interest_rate INTEGER NOT NULL,
    amount_due INTEGER NOT NULL, due_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE raffle_tickets (
    user_id TEXT NOT NULL, number INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (user_id, number)
  );
  CREATE TABLE raffle_state (
    id INTEGER PRIMARY KEY CHECK (id = 1), pot INTEGER NOT NULL, draw_at INTEGER, channel_id TEXT
  );
  `,

  // 2 — remember each member's Discord language
  `ALTER TABLE users ADD COLUMN locale TEXT;`,

  // 3 — one economy per server, transaction ledger and audit log
  `
  CREATE TABLE profiles (
    user_id    TEXT PRIMARY KEY,
    username   TEXT,
    locale     TEXT,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    updated_at INTEGER NOT NULL DEFAULT ${NOW}
  );
  INSERT INTO profiles (user_id, username, locale, created_at, updated_at)
    SELECT user_id, username, locale, created_at, updated_at FROM users;

  CREATE TABLE accounts (
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    wallet     INTEGER NOT NULL DEFAULT 0,
    bank       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    updated_at INTEGER NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (guild_id, user_id)
  );
  INSERT INTO accounts (guild_id, user_id, wallet, bank, created_at, updated_at)
    SELECT '${LEGACY_GUILD}', user_id, wallet, bank, created_at, updated_at FROM users;
  DROP TABLE users;
  CREATE INDEX idx_accounts_networth ON accounts (guild_id, (wallet + bank) DESC);

  CREATE TABLE guild_settings (
    guild_id   TEXT NOT NULL,
    key        TEXT NOT NULL,
    value      TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (guild_id, key)
  );
  INSERT INTO guild_settings (guild_id, key, value)
    SELECT '${LEGACY_GUILD}', key, value FROM settings;
  DROP TABLE settings;

  CREATE TABLE cooldowns_v3 (
    guild_id TEXT NOT NULL, user_id TEXT NOT NULL, name TEXT NOT NULL, expires_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id, name)
  );
  INSERT INTO cooldowns_v3 SELECT '${LEGACY_GUILD}', user_id, name, expires_at FROM cooldowns;
  DROP TABLE cooldowns;
  ALTER TABLE cooldowns_v3 RENAME TO cooldowns;
  CREATE INDEX idx_cooldowns_expiry ON cooldowns (expires_at);

  CREATE TABLE role_rewards_v3 (
    guild_id TEXT NOT NULL, role_id TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0),
    PRIMARY KEY (guild_id, role_id)
  );
  INSERT INTO role_rewards_v3 SELECT '${LEGACY_GUILD}', role_id, amount FROM role_rewards;
  DROP TABLE role_rewards;
  ALTER TABLE role_rewards_v3 RENAME TO role_rewards;

  CREATE TABLE products_v3 (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    name        TEXT NOT NULL COLLATE NOCASE,
    price       INTEGER NOT NULL CHECK (price >= 0),
    description TEXT,
    role_id     TEXT,
    consumable  INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT ${NOW},
    UNIQUE (guild_id, name)
  );
  INSERT INTO products_v3 (id, guild_id, name, price, description, role_id, consumable, created_at)
    SELECT id, '${LEGACY_GUILD}', name, price, description, role_id, consumable, created_at FROM products;

  CREATE TABLE inventory_v3 (
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (guild_id, user_id, product_id)
  );
  INSERT INTO inventory_v3 SELECT '${LEGACY_GUILD}', user_id, product_id, quantity FROM inventory;
  DROP TABLE inventory;
  DROP TABLE products;
  ALTER TABLE products_v3 RENAME TO products;
  ALTER TABLE inventory_v3 RENAME TO inventory;

  CREATE TABLE loans_v3 (
    guild_id TEXT NOT NULL, user_id TEXT NOT NULL,
    principal INTEGER NOT NULL, interest_rate INTEGER NOT NULL,
    amount_due INTEGER NOT NULL, due_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (guild_id, user_id)
  );
  INSERT INTO loans_v3 SELECT '${LEGACY_GUILD}', user_id, principal, interest_rate, amount_due, due_at, created_at FROM loans;
  DROP TABLE loans;
  ALTER TABLE loans_v3 RENAME TO loans;
  CREATE INDEX idx_loans_due ON loans (due_at);

  CREATE TABLE raffle_tickets_v3 (
    guild_id TEXT NOT NULL, user_id TEXT NOT NULL, number INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (guild_id, user_id, number)
  );
  INSERT INTO raffle_tickets_v3 SELECT '${LEGACY_GUILD}', user_id, number, created_at FROM raffle_tickets;
  DROP TABLE raffle_tickets;
  ALTER TABLE raffle_tickets_v3 RENAME TO raffle_tickets;
  CREATE INDEX idx_raffle_number ON raffle_tickets (guild_id, number);

  CREATE TABLE raffle_rounds (
    guild_id TEXT PRIMARY KEY, pot INTEGER NOT NULL, draw_at INTEGER, channel_id TEXT
  );
  INSERT INTO raffle_rounds SELECT '${LEGACY_GUILD}', pot, draw_at, channel_id FROM raffle_state;
  DROP TABLE raffle_state;
  CREATE INDEX idx_raffle_due ON raffle_rounds (draw_at);

  CREATE TABLE ledger (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    account    TEXT NOT NULL CHECK (account IN ('wallet', 'bank')),
    delta      INTEGER NOT NULL,
    balance    INTEGER NOT NULL,
    reason     TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX idx_ledger_member ON ledger (guild_id, user_id, created_at DESC);
  CREATE INDEX idx_ledger_guild ON ledger (guild_id, created_at DESC);

  CREATE TABLE audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    actor_id   TEXT NOT NULL,
    action     TEXT NOT NULL,
    details    TEXT,
    created_at INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX idx_audit_guild ON audit_log (guild_id, created_at DESC);
  `,

  // 4 — sessions of the web dashboard (Discord login)
  `
  CREATE TABLE web_sessions (
    id           TEXT PRIMARY KEY,          -- SHA-256 of the cookie token
    user_id      TEXT NOT NULL,
    username     TEXT NOT NULL,
    avatar       TEXT,
    access_token TEXT NOT NULL,
    guilds       TEXT,                      -- cached guild list (JSON)
    guilds_at    INTEGER,
    expires_at   INTEGER NOT NULL,
    created_at   INTEGER NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX idx_web_sessions_expiry ON web_sessions (expires_at);
  `,
];

/** Tables that belong to one server (used to hand legacy data over to a server). */
export const GUILD_TABLES = [
  'accounts',
  'guild_settings',
  'cooldowns',
  'role_rewards',
  'products',
  'inventory',
  'loans',
  'raffle_tickets',
  'raffle_rounds',
  'ledger',
  'audit_log',
] as const;
