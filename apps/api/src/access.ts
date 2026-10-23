// Who may manage which server: the person must own it or be an administrator
// (the same rule as /config), and the bot must be in it.
import { webSessions, type WebSession } from '@monolith/core';
import type { FastifyRequest } from 'fastify';
import type { DiscordApi, UserGuild } from './discord.ts';
import { HttpError } from './http.ts';

export const SESSION_COOKIE = 'mn_session';
const GUILDS_TTL = 60_000;
const BOT_GUILDS_TTL = 60_000;

export interface DashboardGuild extends UserGuild {
  /** The bot is in this server, so it can be managed. */
  hasBot: boolean;
}

export interface Viewer {
  token: string;
  session: WebSession;
}

export interface Access {
  /** The logged-in person, or a 401. */
  viewer(request: FastifyRequest): Viewer;
  /** Servers the person can manage, with or without the bot. */
  guilds(viewer: Viewer, options?: { fresh?: boolean }): Promise<DashboardGuild[]>;
  /** The server in the URL, or a 403/404 when the person cannot manage it. */
  guild(request: FastifyRequest): Promise<{ viewer: Viewer; guild: DashboardGuild }>;
}

export function access(discord: DiscordApi): Access {
  let botGuilds: { ids: Set<string>; at: number } | null = null;

  async function botGuildIds(fresh: boolean): Promise<Set<string>> {
    if (fresh || !botGuilds || Date.now() - botGuilds.at > BOT_GUILDS_TTL) {
      botGuilds = { ids: await discord.botGuildIds(), at: Date.now() };
    }
    return botGuilds.ids;
  }

  async function userGuilds({ token, session }: Viewer, fresh: boolean): Promise<UserGuild[]> {
    if (
      !fresh &&
      session.guilds &&
      session.guildsAt &&
      Date.now() - session.guildsAt < GUILDS_TTL
    ) {
      return session.guilds as UserGuild[];
    }
    const guilds = (await discord.userGuilds(session.accessToken)).filter((g) => g.canManage);
    webSessions.cacheGuilds(token, guilds);
    session.guilds = guilds;
    session.guildsAt = Date.now();
    return guilds;
  }

  const self: Access = {
    viewer(request) {
      const token = request.cookies[SESSION_COOKIE];
      const session = token ? webSessions.find(token) : null;
      if (!token || !session) throw new HttpError(401, 'unauthorized');
      return { token, session };
    },

    async guilds(viewer, { fresh = false } = {}) {
      const [guilds, withBot] = await Promise.all([userGuilds(viewer, fresh), botGuildIds(fresh)]);
      return guilds
        .map((guild) => ({ ...guild, hasBot: withBot.has(guild.id) }))
        .sort((a, b) => Number(b.hasBot) - Number(a.hasBot) || a.name.localeCompare(b.name));
    },

    async guild(request) {
      const viewer = self.viewer(request);
      const { guildId } = request.params as { guildId?: string };
      if (!guildId || !/^\d{17,20}$/.test(guildId)) throw new HttpError(404, 'unknown_guild');
      const guild = (await self.guilds(viewer)).find((candidate) => candidate.id === guildId);
      if (!guild) throw new HttpError(403, 'forbidden');
      if (!guild.hasBot) throw new HttpError(404, 'bot_not_in_guild');
      return { viewer, guild };
    },
  };
  return self;
}
