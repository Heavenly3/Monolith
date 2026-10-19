import { Events } from 'discord.js';
import { claimLegacyData, logger, settings } from '@spacebet/core';
import { env } from '../env.ts';
import { defineEvent } from '../framework/loader.ts';
import { refreshMentions } from '../framework/mentions.ts';
import { updatePresence } from '../framework/presence.ts';
import * as scheduler from '../jobs/scheduler.ts';

const log = logger.child('ready');

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    log.info(`Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} server(s).`);

    // Data from before economies were split per server goes to the
    // development server, or to the only server the bot is in.
    const owner =
      env.guildId ?? (client.guilds.cache.size === 1 ? client.guilds.cache.firstKey() : null);
    if (owner && claimLegacyData(owner)) settings.clearCache();

    updatePresence(client);
    await refreshMentions(client);
    scheduler.start(client);
  },
});
