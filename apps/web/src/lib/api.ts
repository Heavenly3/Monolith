// Thin client for the dashboard API. Every call shares the session cookie;
// the API refuses changes that do not come from this origin.
import { ref } from 'vue';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const code = typeof body.error === 'string' ? body.error : 'internal';
    super(code);
    this.status = status;
    this.code = code;
    this.details = body;
  }
}

/** Set when the API answers 401, so the app can send the person to the login page. */
export const sessionExpired = ref(false);

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    if (response.status === 401) sessionExpired.value = true;
    throw new ApiError(response.status, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Base path of the routes of one server. */
export const guildPath = (guildId: string, path = ''): string => `/api/guilds/${guildId}${path}`;
