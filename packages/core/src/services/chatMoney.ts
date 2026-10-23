// Credits for chatting: a random amount per message, once per cooldown,
// outside the excluded channels. Paid silently, up to the maximum balance.
import type { UserRef } from '../types.ts';
import { randomBetween } from '../utils/random.ts';
import * as accounts from './accounts.ts';
import * as cooldowns from './cooldowns.ts';
import * as settings from './settings.ts';

/** Credits paid for a message in `channelId`; 0 when it earns nothing. */
export function award(guildId: string, user: UserRef, channelId: string): number {
  if (!settings.get(guildId, 'modules.economy') || !settings.get(guildId, 'chat.enabled')) return 0;
  if (settings.get(guildId, 'chat.ignoredChannels').includes(channelId)) return 0;
  if (cooldowns.remaining(guildId, user.id, 'chat')) return 0;

  cooldowns.startConfigured(guildId, user.id, 'chat');
  accounts.getAccount(guildId, user);
  const { min, max } = settings.get(guildId, 'chat.range');
  return accounts.earn(guildId, user.id, randomBetween(min, max), 'chat');
}
