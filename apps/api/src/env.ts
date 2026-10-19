import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root: the .env file and the storage folder live there. */
export const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

try {
  process.loadEnvFile(path.join(ROOT_DIR, '.env'));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

const optional = (name: string): string | null => process.env[name]?.trim() || null;
const trimSlash = (url: string): string => url.replace(/\/+$/, '');

export interface ApiConfig {
  clientId: string;
  clientSecret: string;
  botToken: string;
  port: number;
  /** Public address of this API; Discord redirects to `${apiUrl}/auth/callback`. */
  apiUrl: string;
  /** Address of the dashboard; users return there after logging in. */
  webUrl: string;
  databasePath: string;
}

export function loadConfig(): ApiConfig {
  const port = Number(optional('API_PORT') ?? 3000);
  return {
    clientId: required('CLIENT_ID'),
    clientSecret: required('CLIENT_SECRET'),
    botToken: required('TOKEN'),
    port,
    apiUrl: trimSlash(optional('API_URL') ?? `http://localhost:${port}`),
    webUrl: trimSlash(optional('WEB_URL') ?? 'http://localhost:5180'),
    databasePath: path.resolve(ROOT_DIR, optional('DATABASE_PATH') ?? 'storage/mythcore.db'),
  };
}
