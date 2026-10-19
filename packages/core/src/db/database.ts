import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import { GUILD_TABLES, LEGACY_GUILD, MIGRATIONS } from './migrations.ts';
import { logger } from '../logger.ts';

const log = logger.child('db');

let connection: DatabaseSync | null = null;
const statements = new Map<string, StatementSync>();

/**
 * Opens (or creates) the database and applies pending migrations.
 * Use ':memory:' for tests. node:sqlite is synchronous, so statements never
 * interleave and every balance update is atomic without extra locking.
 */
export function openDatabase(file: string): DatabaseSync {
  closeDatabase();
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });

  connection = new DatabaseSync(file);
  connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
  `);
  migrate(connection);
  connection.exec('PRAGMA foreign_keys = ON');
  return connection;
}

export function db(): DatabaseSync {
  if (!connection) throw new Error('Database not opened. Call openDatabase() first.');
  return connection;
}

/** Cached prepared statement. */
export function sql(query: string): StatementSync {
  let statement = statements.get(query);
  if (!statement) {
    statement = db().prepare(query);
    statements.set(query, statement);
  }
  return statement;
}

/** First row of a query, typed by the caller. */
export function one<T>(query: string, ...params: SQLInputValue[]): T | undefined {
  return sql(query).get(...params) as T | undefined;
}

/** All rows of a query, typed by the caller. */
export function many<T>(query: string, ...params: SQLInputValue[]): T[] {
  return sql(query).all(...params) as T[];
}

/** Runs a write statement and returns the number of changed rows. */
export function run(
  query: string,
  ...params: SQLInputValue[]
): { changes: number; lastId: number } {
  const result = sql(query).run(...params);
  return { changes: Number(result.changes), lastId: Number(result.lastInsertRowid) };
}

/** Runs `fn` inside a transaction (nested calls join the outer one). */
export function transaction<T>(fn: () => T): T {
  const database = db();
  if (database.isTransaction) return fn();
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function closeDatabase(): void {
  statements.clear();
  if (connection?.isOpen) connection.close();
  connection = null;
}

function migrate(database: DatabaseSync): void {
  const { user_version: current } = database.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  // Table rebuilds need foreign keys off; they are switched back on afterwards.
  database.exec('PRAGMA foreign_keys = OFF');
  for (let version = current; version < MIGRATIONS.length; version++) {
    database.exec('BEGIN');
    try {
      database.exec(MIGRATIONS[version]!);
      database.exec(`PRAGMA user_version = ${version + 1}`);
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw new Error(`Migration ${version + 1} failed: ${(error as Error).message}`, {
        cause: error,
      });
    }
    log.info(`Applied migration ${version + 1}/${MIGRATIONS.length}`);
  }
}

/**
 * Hands data created before economies were split per server to `guildId`.
 * Returns true when there was something to hand over.
 */
export function claimLegacyData(guildId: string): boolean {
  const pending = GUILD_TABLES.some((table) =>
    db().prepare(`SELECT 1 FROM ${table} WHERE guild_id = ? LIMIT 1`).get(LEGACY_GUILD),
  );
  if (!pending) return false;

  transaction(() => {
    for (const table of GUILD_TABLES) {
      db()
        .prepare(`UPDATE OR IGNORE ${table} SET guild_id = ? WHERE guild_id = ?`)
        .run(guildId, LEGACY_GUILD);
      db().prepare(`DELETE FROM ${table} WHERE guild_id = ?`).run(LEGACY_GUILD);
    }
  });
  log.info(`Legacy data assigned to server ${guildId}.`);
  return true;
}
