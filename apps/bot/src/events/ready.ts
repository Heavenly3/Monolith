import { Events } from 'discord.js';
import { claimLegacyData, logger, settings } from '@mythcore/core';
import { env } from '../env.ts';
import { defineEvent } from '../framework/loader.ts';
import { refreshMentions } from '../framework/mentions.ts';
import { updatePresence } from '../framework/presence.ts';
import * as scheduler from '../jobs/scheduler.ts';
import { registerApplicationEmojis } from '../ui/emojis.ts';

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

    // Use the custom icon set if it was uploaded with `npm run emojis`.
    try {
      const icons = registerApplicationEmojis((await client.application.emojis.fetch()).values());
      log.info(
        icons ? `Using ${icons} custom icons.` : 'No custom icons uploaded; using Unicode emojis.',
      );
    } catch (error) {
      log.warn('Could not load application emojis:', (error as Error).message);
    }

    updatePresence(client);
    await refreshMentions(client);
    scheduler.start(client);
  },
});
