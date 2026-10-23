// Turns a backup file (JSON or CSV, ours or another bot's) into rows of a
// user id and its fields. Field names are normalised to lower case without
// spaces, dashes or underscores, so "User ID", "user_id" and "userId" match.

export interface BackupRow {
  id: unknown;
  fields: Record<string, unknown>;
}

const normalise = (name: string): string => name.toLowerCase().replace(/[\s_-]/g, '');

const ID_FIELDS = ['userid', 'id', 'user', 'discordid', 'memberid'];

function normaliseFields(entry: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(entry).map(([key, value]) => [normalise(key), value]));
}

const idOf = (fields: Record<string, unknown>): unknown =>
  ID_FIELDS.map((name) => fields[name]).find((value) => value !== undefined);

function fromJson(data: unknown, scalarField: string): BackupRow[] {
  const container = data as { members?: unknown; users?: unknown } | null;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(container?.members)
      ? container.members
      : null;
  if (list) {
    return list.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const fields = normaliseFields(item as Record<string, unknown>);
      return [{ id: idOf(fields), fields }];
    });
  }
  // Object keyed by user id; Polaris nests it under "users".
  const map = container?.users ?? data;
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map as Record<string, unknown>).map(([id, value]) => ({
    id,
    fields:
      typeof value === 'object' && value
        ? normaliseFields(value as Record<string, unknown>)
        : { [scalarField]: value },
  }));
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

function fromCsv(text: string): BackupRow[] {
  const [header, ...lines] = text.split(/\r?\n/).filter((line) => line.trim());
  if (!header) return [];
  const columns = cells(header).map(normalise);
  return lines.map((line) => {
    const row = cells(line);
    const fields = Object.fromEntries(columns.map((name, i) => [name, row[i]]));
    return { id: idOf(fields), fields };
  });
}

/**
 * Rows of a backup. `scalarField` names the value of files shaped
 * { "<id>": 1234 } (e.g. "xp"). Unreadable files give no rows.
 */
export function parseRows(text: string, scalarField = 'value'): BackupRow[] {
  const trimmed = text.trim().replace(/^\uFEFF/, '');
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return fromJson(JSON.parse(trimmed), scalarField);
    } catch {
      return [];
    }
  }
  return fromCsv(trimmed);
}
