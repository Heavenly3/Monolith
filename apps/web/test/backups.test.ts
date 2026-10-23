import { describe, expect, it } from 'vitest';
import { parseEconomyBackup } from '../src/lib/economyBackup.ts';
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

describe('balance backups', () => {
  it('reads our export, cash/bank columns and totals only', () => {
    const ours = JSON.stringify({ members: [{ userId: A, wallet: 300, bank: 20, total: 320 }] });
    expect(parseEconomyBackup(ours)).toEqual([{ userId: A, wallet: 300, bank: 20 }]);
    const csv = [
      'Rank,User ID,Username,Cash,Bank,Total',
      `1,${A},"Kael","1,500","2,000","3,500"`,
    ].join('\n');
    expect(parseEconomyBackup(csv)).toEqual([{ userId: A, wallet: 1500, bank: 2000 }]);
    const other = ['User ID;Cash;Bank', `${B};1200;800`].join('\n');
    expect(parseEconomyBackup(other)).toEqual([{ userId: B, wallet: 1200, bank: 800 }]);
    expect(parseEconomyBackup(JSON.stringify({ [A]: 900 }))).toEqual([
      { userId: A, wallet: 900, bank: 0 },
    ]);
    expect(parseEconomyBackup('name,points\nkael,5')).toEqual([]);
  });
});
