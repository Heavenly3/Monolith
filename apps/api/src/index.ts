import { closeDatabase, logger, openDatabase, webSessions } from '@mythcore/core';
import { buildApp } from './app.ts';
import { createDiscordApi } from './discord.ts';
import { loadConfig } from './env.ts';

const log = logger.child('api');
const config = loadConfig();

openDatabase(config.databasePath);
webSessions.prune();
const pruner = setInterval(() => webSessions.prune(), 60 * 60 * 1000);
pruner.unref();

const app = await buildApp({ config, discord: createDiscordApi(config) });
await app.listen({ port: config.port, host: '0.0.0.0' });
log.info(`Dashboard API listening on ${config.apiUrl} (dashboard: ${config.webUrl}).`);

async function shutdown(signal: string): Promise<void> {
  log.info(`${signal} received, shutting down...`);
  await app.close();
  closeDatabase();
  process.exit(0);
}
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
