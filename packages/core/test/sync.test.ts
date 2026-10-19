import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, openDatabase, settings } from '../src/index.ts';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mythcore-'));
afterEach(() => closeDatabase());

describe('settings shared between processes', () => {
  it('sees changes written by another connection (the dashboard)', () => {
    const file = path.join(dir, 'shared.db');
    openDatabase(file);
    settings.clearCache();
    expect(settings.get('g', 'work.cooldown')).toBe(3600);

    const dashboard = new DatabaseSync(file);
    dashboard
      .prepare('INSERT INTO guild_settings (guild_id, key, value, updated_at) VALUES (?, ?, ?, ?)')
      .run('g', 'work.cooldown', '60', Date.now());
    dashboard.close();

    expect(settings.get('g', 'work.cooldown')).toBe(60);
  });
});
