import { ActivityType, type Client } from 'discord.js';
import { translate } from '@mythcore/i18n';
import { emojis } from '../ui/emojis.ts';

/** Status line under the bot's name. */
export function updatePresence(client: Client<true>): void {
  client.user.setActivity({
    type: ActivityType.Custom,
    name: 'custom',
    state: `${emojis.crest} ${translate('en', 'status')}`,
  });
}
