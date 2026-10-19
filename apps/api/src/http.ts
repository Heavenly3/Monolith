/** Error sent to the dashboard as `{ error: code, ...details }`. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, details: Record<string, unknown> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** A whole-number URL parameter, or a 404. */
export function indexParam(params: unknown, name: string): number {
  const raw = (params as Record<string, string | undefined>)[name] ?? '';
  if (!/^\d{1,9}$/.test(raw)) throw new HttpError(404, `unknown_${name}`);
  return Number(raw);
}
