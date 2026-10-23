import { REST, Routes, type RESTPutAPIApplicationCommandsResult } from 'discord.js';
import { logger } from '@monolith/core';
import { env } from './env.ts';
import { loadCommands } from './framework/loader.ts';
import { userMenuJson } from './i18n/localizeCommand.ts';

const log = logger.child('deploy');

const args = new Set(process.argv.slice(2));
const isGlobal = args.has('--global') || !env.guildId;
const clear = args.has('--clear');

try {
  const commands = [...(await loadCommands()).values()];
  const menus = commands.flatMap((command) =>
    command.userMenu ? [userMenuJson(command.userMenu.nameKey)] : [],
  );
  const body = clear ? [] : [...commands.map((command) => command.json), ...menus];
  const rest = new REST().setToken(env.token);
  const route = isGlobal
    ? Routes.applicationCommands(env.clientId)
    : Routes.applicationGuildCommands(env.clientId, env.guildId!);

  log.info(
    `${clear ? 'Clearing' : `Deploying ${body.length}`} commands ${
      isGlobal ? 'globally' : `to server ${env.guildId}`
    }...`,
  );
  const data = (await rest.put(route, { body })) as RESTPutAPIApplicationCommandsResult;
  log.info(`Done — ${data.length} commands registered.`);
} catch (error) {
  log.error('Deployment failed:', error);
  process.exitCode = 1;
}
