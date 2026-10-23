// Pages anyone can open without logging in. A server shows its level ranking
// here only after an admin turns on levels.publicLeaderboard.
import { levels, progressFor, settings } from '@monolith/core';
import type { FastifyInstance } from 'fastify';
import type { GuildInfo } from '../discord.ts';
import { HttpError } from '../http.ts';

const GUILD_CACHE_MS = 5 * 60_000;

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  // Name and icon change rarely; this keeps a busy page from hitting Discord.
  const guilds = new Map<string, { info: GuildInfo | null; until: number }>();
  async function guildInfo(guildId: string): Promise<GuildInfo | null> {
    const cached = guilds.get(guildId);
    if (cached && cached.until > Date.now()) return cached.info;
    const info = await app.discord.guildInfo(guildId);
    guilds.set(guildId, { info, until: Date.now() + GUILD_CACHE_MS });
    return info;
  }

  app.get(
    '/api/public/:guildId/leaderboard',
    {
      schema: {
        params: {
          type: 'object',
          properties: { guildId: { type: 'string', pattern: '^\\d{17,20}$' } },
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 0, maximum: 1000, default: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        },
      },
    },
    async (request) => {
      const { guildId } = request.params as { guildId: string };
      const { page, limit } = request.query as { page: number; limit: number };
      const open =
        settings.get(guildId, 'modules.levels') &&
        settings.get(guildId, 'levels.publicLeaderboard');
      if (!open) throw new HttpError(404, 'not_public');
      const guild = await guildInfo(guildId);
      if (!guild) throw new HttpError(404, 'not_public');

      const curve = levels.curveOf(guildId);
      const offset = page * limit;
      return {
        guild,
        total: levels.leaderboardSize(guildId),
        page,
        limit,
        rewards: levels.rewards(guildId).map(({ level, roleId }) => ({ level, roleId })),
        members: levels.leaderboard(guildId, limit, offset).map((member, index) => ({
          rank: offset + index + 1,
          userId: member.userId,
          username: member.username,
          xp: member.xp,
          level: member.level,
          messages: member.messages,
          progress: progressFor(member.xp, curve),
        })),
      };
    },
  );
}
