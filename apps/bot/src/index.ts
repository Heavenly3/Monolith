import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { closeDatabase, logger, openDatabase } from '@mythcore/core';
import { env } from './env.ts';
import { loadCommands, registerEvents } from './framework/loader.ts';
import * as scheduler from './jobs/scheduler.ts';

openDatabase(env.databasePath);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

client.commands = await loadCommands();
const eventCount = await registerEvents(client);
logger.info(`Loaded ${client.commands.size} commands and ${eventCount} events.`);

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down...`);
  scheduler.stop();
  await client.destroy().catch(() => {});
  closeDatabase();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (error) => logger.error('Unhandled rejection:', error));
process.on('uncaughtException', (error) => logger.error('Uncaught exception:', error));

try {
  await client.login(env.token);
} catch (error) {
  logger.error('Failed to log in:', (error as Error).message);
  closeDatabase();
  process.exit(1);
}
