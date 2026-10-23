import { describe, expect, it } from 'vitest';
import { parseXpBackup } from '../src/lib/xpBackup.ts';

const A = '123456789012345678';
const B = '223456789012345678';

describe('experience backups', () => {
  it('reads our JSON export and plain lists', () => {
    const file = JSON.stringify({ members: [{ userId: A, xp: 300, messages: 4 }] });
    expect(parseXpBackup(file)).toEqual([{ userId: A, xp: 300, messages: 4 }]);
    expect(parseXpBackup(JSON.stringify([{ id: B, xp: '12' }]))).toMatchObject([
      { userId: B, xp: 12 },
    ]);
  });

  it('reads objects keyed by user id', () => {
    expect(parseXpBackup(JSON.stringify({ users: { [A]: { xp: 50 }, nope: { xp: 1 } } }))).toEqual([
      { userId: A, xp: 50 },
    ]);
    expect(parseXpBackup(JSON.stringify({ [B]: 70 }))).toEqual([{ userId: B, xp: 70 }]);
  });

  it('reads CSV with quoted names and skips bad rows', () => {
    const csv = [
      'rank,userId,username,xp,level',
      `1,${A},"Kael, ""the"" Operator",900,4`,
      `2,${B},x,-5,0`,
      `3,${B},y,40,0`,
    ].join('\n');
    expect(parseXpBackup(csv)).toMatchObject([
      { userId: A, xp: 900 },
      { userId: B, xp: 40 },
    ]);
    expect(parseXpBackup('name,points\nkael,5')).toEqual([]);
    expect(parseXpBackup('{ broken')).toEqual([]);
  });
});
