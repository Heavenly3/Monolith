import { Events } from 'discord.js';
import { levels, logger, settings } from '@monolith/core';
import { defineEvent } from '../framework/loader.ts';
import { afterXpGain } from '../services/levelUp.ts';

const log = logger.child('levels');

// Experience for chatting. Message content is never read, only who wrote
// where, so the bot needs no privileged intent.
export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.inGuild() || message.author.bot || message.webhookId || message.system) return;
    if (!settings.get(message.guildId, 'modules.levels') || !message.member) return;

    // Threads count as their parent channel for ignore lists and multipliers.
    const channelId = message.channel.isThread()
      ? (message.channel.parentId ?? message.channelId)
      : message.channelId;
    const gain = levels.awardMessage(message.guildId, message.author, {
      channelId,
      roleIds: [...message.member.roles.cache.keys()],
    });
    if (!gain) return;

    try {
      await afterXpGain(message.member, gain, message.channel);
    } catch (error) {
      log.error(`Level-up handling failed in ${message.guildId}:`, error);
    }
  },
});
