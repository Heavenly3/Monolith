import { closeDatabase, openDatabase } from '../src/index.ts';
import * as settings from '../src/services/settings.ts';

export const GUILD = 'guild-1';
export const OTHER_GUILD = 'guild-2';
export const alice = { id: 'alice', username: 'alice' };
export const bob = { id: 'bob', username: 'bob' };

/** Fresh in-memory database for each test. */
export function freshDatabase(): void {
  closeDatabase();
  settings.clearCache();
  openDatabase(':memory:');
}
