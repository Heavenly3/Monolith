import { Events } from 'discord.js';
import { chatMoney, levels, logger, settings } from '@monolith/core';
import { defineEvent } from '../framework/loader.ts';
import { activityOf, afterXpGain } from '../services/levelUp.ts';

const log = logger.child('levels');

// Experience for chatting. Message content is never read, only who wrote
// where, so the bot needs no privileged intent.
export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.inGuild() || message.author.bot || message.webhookId || message.system) return;
    if (!message.member) return;
    const channelId = message.channel.isThread()
      ? (message.channel.parentId ?? message.channelId)
      : message.channelId;
    chatMoney.award(message.guildId, message.author, channelId);
    if (!settings.get(message.guildId, 'modules.levels')) return;

    const gain = levels.awardMessage(
      message.guildId,
      message.author,
      activityOf(message.member, message.channel),
    );
    if (!gain) return;

    try {
      await afterXpGain(message.member, gain, message.channel);
    } catch (error) {
      log.error(`Level-up handling failed in ${message.guildId}:`, error);
    }
  },
});
