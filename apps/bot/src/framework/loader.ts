import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Client, ClientEvents } from 'discord.js';
import { logger, type ModuleId } from '@monolith/core';
import { localizeCommand } from '../i18n/localizeCommand.ts';
import type { CommandDefinition, LoadedCommand } from './types.ts';

const log = logger.child('loader');
const SRC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMMANDS_DIR = path.join(SRC_DIR, 'commands');
const EVENTS_DIR = path.join(SRC_DIR, 'events');

// Module of the commands in each folder (a command can override it).
const FOLDER_MODULES: Record<string, ModuleId> = {
  economy: 'economy',
  games: 'games',
  shop: 'shop',
  loans: 'loans',
  levels: 'levels',
};

function tsFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.startsWith('_'))
    .map((entry) => path.join(dir, entry.name));
}

/**
 * Loads every command from src/commands/<category>/<name>.ts (default export).
 * Files starting with "_" are shared helpers and are skipped.
 */
export async function loadCommands(): Promise<Map<string, LoadedCommand>> {
  const commands = new Map<string, LoadedCommand>();
  const categories = fs
    .readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const category of categories) {
    for (const file of tsFiles(path.join(COMMANDS_DIR, category))) {
      const { default: command } = (await import(pathToFileURL(file).href)) as {
        default?: CommandDefinition;
      };
      if (!command?.data || typeof command.execute !== 'function') {
        log.warn(`Skipping ${path.relative(COMMANDS_DIR, file)}: no default command export.`);
        continue;
      }
      const { name } = command.data;
      if (commands.has(name)) throw new Error(`Duplicate command name "/${name}"`);
      const json = localizeCommand(command.data.toJSON());
      commands.set(name, {
        ...command,
        category,
        json,
        adminOnly: Boolean(json.default_member_permissions),
        module: command.module ?? FOLDER_MODULES[category] ?? null,
      });
    }
  }
  return commands;
}

export interface EventDefinition<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<unknown> | unknown;
}

/** Identity helper for typed event files. */
export function defineEvent<K extends keyof ClientEvents>(
  event: EventDefinition<K>,
): EventDefinition<K> {
  return event;
}

export async function registerEvents(client: Client): Promise<number> {
  const files = tsFiles(EVENTS_DIR);
  for (const file of files) {
    const { default: event } = (await import(pathToFileURL(file).href)) as {
      default: EventDefinition;
    };
    const handler = async (...args: unknown[]): Promise<void> => {
      try {
        await (event.execute as (...a: unknown[]) => unknown)(...args);
      } catch (error) {
        log.error(`Unhandled error in "${event.name}" event:`, error);
      }
    };
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
  }
  return files.length;
}
