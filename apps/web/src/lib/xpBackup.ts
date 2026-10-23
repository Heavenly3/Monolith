// Reads an experience backup picked by an admin: our own JSON or CSV export,
// a plain list, or an object keyed by user id (the shape Polaris and similar
// bots use: { "<id>": { "xp": 1234 } } or { "<id>": 1234 }).

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

function record(id: unknown, source: Record<string, unknown>): XpRecord | null {
  const userId = String(id ?? '').trim();
  const xp = whole(source.xp ?? source.experience ?? source.exp);
  if (!SNOWFLAKE.test(userId) || xp === undefined) return null;
  return {
    userId,
    xp,
    messages: whole(source.messages),
    voiceMinutes: whole(source.voiceMinutes),
  };
}

function fromJson(data: unknown): XpRecord[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { members?: unknown }).members)
      ? (data as { members: unknown[] }).members
      : null;
  if (list) {
    return list.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const entry = item as Record<string, unknown>;
      return record(entry.userId ?? entry.id ?? entry.user_id, entry) ?? [];
    });
  }
  // Object keyed by user id; Polaris nests it under "users".
  const map = (data as { users?: unknown })?.users ?? data;
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map as Record<string, unknown>).flatMap(([id, value]) => {
    const entry =
      typeof value === 'object' && value ? (value as Record<string, unknown>) : { xp: value };
    return record(id, entry) ?? [];
  });
}

/** Splits one CSV line, honouring quoted cells with commas and doubled quotes. */
function cells(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') quoted = false;
      else current += char;
    } else if (char === '"') quoted = true;
    else if (char === ',' || char === ';') {
      out.push(current);
      current = '';
    } else current += char;
  }
  out.push(current);
  return out.map((cell) => cell.trim());
}

function fromCsv(text: string): XpRecord[] {
  const [header, ...rows] = text.split(/\r?\n/).filter((line) => line.trim());
  if (!header) return [];
  const columns = cells(header).map((name) => name.toLowerCase());
  const index = (...names: string[]) => columns.findIndex((name) => names.includes(name));
  const id = index('userid', 'id', 'user_id', 'user');
  const xp = index('xp', 'experience', 'exp');
  if (id < 0 || xp < 0) return [];
  const messages = index('messages');
  const voice = index('voiceminutes');
  return rows.flatMap((line) => {
    const row = cells(line);
    return (
      record(row[id], {
        xp: row[xp],
        messages: messages >= 0 ? row[messages] : undefined,
        voiceMinutes: voice >= 0 ? row[voice] : undefined,
      }) ?? []
    );
  });
}

/** Experience records found in a file; an empty list when nothing is usable. */
export function parseXpBackup(text: string): XpRecord[] {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  let records: XpRecord[];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      records = fromJson(JSON.parse(trimmed));
    } catch {
      return [];
    }
  } else {
    records = fromCsv(trimmed);
  }
  // One record per member: the last one wins.
  return [...new Map(records.map((r) => [r.userId, r])).values()];
}
