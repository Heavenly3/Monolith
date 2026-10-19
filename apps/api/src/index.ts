import fs from 'node:fs';
import path from 'node:path';
import { closeDatabase, logger, openDatabase, webSessions } from '@mythcore/core';
import { buildApp } from './app.ts';
import { createDiscordApi } from './discord.ts';
import { ROOT_DIR, loadConfig } from './env.ts';

const log = logger.child('api');
const config = loadConfig();

openDatabase(config.databasePath);
webSessions.prune();
const pruner = setInterval(() => webSessions.prune(), 60 * 60 * 1000);
pruner.unref();

// After `npm run build:web` the API also serves the dashboard.
const webDir = path.join(ROOT_DIR, 'apps', 'web', 'dist');
const servesWeb = fs.existsSync(path.join(webDir, 'index.html'));

const app = await buildApp({
  config,
  discord: createDiscordApi(config),
  webDir: servesWeb ? webDir : null,
});
await app.listen({ port: config.port, host: '0.0.0.0' });
log.info(
  servesWeb
    ? `Dashboard and API on ${config.apiUrl}.`
    : `Dashboard API on ${config.apiUrl} (dashboard: ${config.webUrl}, run npm run web).`,
);

async function shutdown(signal: string): Promise<void> {
  log.info(`${signal} received, shutting down...`);
  await app.close();
  closeDatabase();
  process.exit(0);
}
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
