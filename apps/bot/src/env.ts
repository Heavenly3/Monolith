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

function optional(name: string): string | null {
  return process.env[name]?.trim() || null;
}

export const env = {
  get token(): string {
    return required('TOKEN');
  },
  get clientId(): string {
    return required('CLIENT_ID');
  },
  /** Development server: commands deploy there instantly. */
  guildId: optional('GUILD_ID'),
  databasePath: path.resolve(ROOT_DIR, optional('DATABASE_PATH') ?? 'storage/monolith.db'),
};
