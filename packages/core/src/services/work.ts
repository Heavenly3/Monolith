import * as settings from './settings.ts';

export const MAX_MESSAGES = 50;

/**
 * Job messages of a server. Until an admin customises them, the built-in
 * messages (passed in the language of the reply) are used.
 */
export function getMessages(guildId: string, builtIn: string[]): string[] {
  return settings.get(guildId, 'work.messages') ?? [...builtIn];
}

export function usesBuiltIn(guildId: string): boolean {
  return settings.get(guildId, 'work.messages') === null;
}

/** Adds a message. Customising the built-in list keeps it in the current language. */
export function addMessage(guildId: string, message: string, builtIn: string[]): 'ok' | 'full' {
  const messages = getMessages(guildId, builtIn);
  if (messages.length >= MAX_MESSAGES) return 'full';
  settings.set(guildId, 'work.messages', [...messages, message.trim()]);
  return 'ok';
}

export function removeMessage(guildId: string, index: number, builtIn: string[]): string | null {
  const messages = getMessages(guildId, builtIn);
  const [removed] = messages.splice(index, 1);
  if (removed === undefined) return null;
  settings.set(guildId, 'work.messages', messages);
  return removed;
}

export function resetAll(guildId: string): void {
  settings.reset(guildId, 'work.messages', 'work.range', 'work.cooldown');
}
