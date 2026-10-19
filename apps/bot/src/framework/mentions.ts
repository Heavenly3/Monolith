import { chatInputApplicationCommandMention, type Client } from 'discord.js';
import { logger } from '@mythcore/core';
import { env } from '../env.ts';

const log = logger.child('mentions');
const ids = new Map<string, string>();

/** Caches the IDs of the deployed commands so they can be mentioned. */
export async function refreshMentions(client: Client<true>): Promise<void> {
  try {
    const commands = env.guildId
      ? await (await client.guilds.fetch(env.guildId)).commands.fetch()
      : await client.application.commands.fetch();
    ids.clear();
    for (const command of commands.values()) ids.set(command.name, command.id);
  } catch (error) {
    log.warn('Could not fetch application commands:', (error as Error).message);
  }
}

/** Clickable mention like </loan repay:123>, or `/loan repay` as fallback. */
export function mention(fullName: string): string {
  const [name = '', sub] = fullName.split(' ');
  const id = ids.get(name);
  if (!id) return `\`/${fullName}\``;
  if (sub) return chatInputApplicationCommandMention(name, sub, id);
  return chatInputApplicationCommandMention(name, id);
}
