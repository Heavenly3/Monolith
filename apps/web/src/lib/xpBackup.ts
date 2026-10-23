// Reads an experience backup picked by an admin: our own JSON or CSV export,
// a plain list, or an object keyed by user id (the shape Polaris and similar
// bots use: { "<id>": { "xp": 1234 } } or { "<id>": 1234 }).
import { parseRows } from './backupFiles.ts';

export interface XpRecord {
  userId: string;
  xp: number;
  messages?: number;
  voiceMinutes?: number;
}

const SNOWFLAKE = /^\d{17,20}$/;

const whole = (value: unknown): number | undefined => {
  const number = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof number === 'number' && Number.isFinite(number) && number >= 0
    ? Math.floor(number)
    : undefined;
};

function record(id: unknown, fields: Record<string, unknown>): XpRecord | null {
  const userId = String(id ?? '').trim();
  const xp = whole(fields.xp ?? fields.experience ?? fields.exp);
  if (!SNOWFLAKE.test(userId) || xp === undefined) return null;
  const result: XpRecord = { userId, xp };
  const messages = whole(fields.messages);
  const voiceMinutes = whole(fields.voiceminutes);
  if (messages !== undefined) result.messages = messages;
  if (voiceMinutes !== undefined) result.voiceMinutes = voiceMinutes;
  return result;
}

/** Experience records found in a file; an empty list when nothing is usable. */
export function parseXpBackup(text: string): XpRecord[] {
  const records = parseRows(text, 'xp').flatMap(({ id, fields }) => record(id, fields) ?? []);
  // One record per member: the last one wins.
  return [...new Map(records.map((r) => [r.userId, r])).values()];
}
