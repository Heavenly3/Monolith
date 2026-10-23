// Levels of a server: role rewards, XP multipliers and members' experience.
// Reward roles are applied by the bot the next time each member earns XP.
import { audit, levels, progressFor, type LevelReward, type XpAction } from '@monolith/core';
import type { FastifyInstance } from 'fastify';
import { HttpError } from '../http.ts';
import { scope } from './scope.ts';

const SNOWFLAKE = '^\\d{17,20}$';

export async function levelRoutes(app: FastifyInstance): Promise<void> {
  async function roleExists(guildId: string, roleId: string): Promise<boolean> {
    const roles = await app.discord.guildRoles(guildId);
    return roleId !== guildId && roles.some((role) => role.id === roleId && !role.managed);
  }

  app.get('/channels', async (request) => {
    const { guild } = scope(request);
    return { channels: await app.discord.guildChannels(guild.id) };
  });

  app.get('/levels', async (request) => {
    const { guild } = scope(request);
    return {
      stats: levels.stats(guild.id),
      rewards: levels.rewards(guild.id),
      multipliers: levels.multipliers(guild.id),
      maxRewards: levels.MAX_REWARDS,
      maxMultipliers: levels.MAX_MULTIPLIERS,
      messages: levels.levelMessages(guild.id),
      maxMessages: levels.MAX_LEVEL_MESSAGES,
    };
  });

  app.put(
    '/levels/messages',
    {
      schema: {
        body: {
          type: 'object',
          required: ['level', 'message'],
          additionalProperties: false,
          properties: {
            level: { type: 'integer', minimum: 1, maximum: 1000 },
            message: { type: 'string', minLength: 1, maxLength: levels.LEVEL_MESSAGE_LENGTH },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const entry = request.body as { level: number; message: string };
      const result = levels.setLevelMessage(guild.id, entry);
      if (result === 'full') throw new HttpError(409, 'full', { max: levels.MAX_LEVEL_MESSAGES });
      if (result === 'invalid') throw new HttpError(422, 'invalid_value', { field: 'message' });
      audit.record(guild.id, viewer.session.userId, 'levelMessages.set', {
        source: 'web',
        level: entry.level,
      });
      return { ok: true };
    },
  );

  app.delete('/levels/messages/:level', async (request) => {
    const { guild, viewer } = scope(request);
    const level = Number((request.params as { level: string }).level);
    if (!levels.removeLevelMessage(guild.id, level)) throw new HttpError(404, 'unknown_message');
    audit.record(guild.id, viewer.session.userId, 'levelMessages.remove', { source: 'web', level });
    return { ok: true };
  });

  app.post(
    '/levels/rewards',
    {
      schema: {
        body: {
          type: 'object',
          required: ['level', 'roleId'],
          additionalProperties: false,
          properties: {
            level: { type: 'integer', minimum: 1, maximum: 1000 },
            roleId: { type: 'string', pattern: SNOWFLAKE },
            keep: { type: 'boolean' },
            noSync: { type: 'boolean' },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const body = request.body as LevelReward;
      const reward: LevelReward = {
        level: body.level,
        roleId: body.roleId,
        keep: body.keep || undefined,
        noSync: body.noSync || undefined,
      };
      if (!(await roleExists(guild.id, reward.roleId))) throw new HttpError(422, 'invalid_role');
      if (levels.addReward(guild.id, reward) === 'full') {
        throw new HttpError(409, 'full', { max: levels.MAX_REWARDS });
      }
      audit.record(guild.id, viewer.session.userId, 'levelRewards.add', {
        source: 'web',
        ...reward,
      });
      return { ok: true };
    },
  );

  app.delete('/levels/rewards/:roleId', async (request) => {
    const { guild, viewer } = scope(request);
    const { roleId } = request.params as { roleId: string };
    if (!levels.removeReward(guild.id, roleId)) throw new HttpError(404, 'unknown_reward');
    audit.record(guild.id, viewer.session.userId, 'levelRewards.remove', { source: 'web', roleId });
    return { ok: true };
  });

  app.put(
    '/levels/multipliers',
    {
      schema: {
        body: {
          type: 'object',
          required: ['type', 'id', 'percent'],
          additionalProperties: false,
          properties: {
            type: { enum: ['role', 'channel'] },
            id: { type: 'string', pattern: SNOWFLAKE },
            percent: { type: 'integer', minimum: 0, maximum: 1000 },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const multiplier = request.body as { type: 'role' | 'channel'; id: string; percent: number };
      const exists =
        multiplier.type === 'role'
          ? (await app.discord.guildRoles(guild.id)).some((role) => role.id === multiplier.id)
          : (await app.discord.guildChannels(guild.id)).some((c) => c.id === multiplier.id);
      if (!exists) throw new HttpError(422, `invalid_${multiplier.type}`);
      if (levels.setMultiplier(guild.id, multiplier) === 'full') {
        throw new HttpError(409, 'full', { max: levels.MAX_MULTIPLIERS });
      }
      audit.record(guild.id, viewer.session.userId, 'levelMultipliers.set', {
        source: 'web',
        ...multiplier,
      });
      return { ok: true };
    },
  );

  app.delete('/levels/multipliers/:type/:id', async (request) => {
    const { guild, viewer } = scope(request);
    const { type, id } = request.params as { type: string; id: string };
    if ((type !== 'role' && type !== 'channel') || !levels.removeMultiplier(guild.id, type, id)) {
      throw new HttpError(404, 'unknown_multiplier');
    }
    audit.record(guild.id, viewer.session.userId, 'levelMultipliers.remove', {
      source: 'web',
      type,
      id,
    });
    return { ok: true };
  });

  app.get(
    '/levels/members',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          },
        },
      },
    },
    async (request) => {
      const { guild } = scope(request);
      const { page, limit } = request.query as { page: number; limit: number };
      const curve = levels.curveOf(guild.id);
      return {
        total: levels.leaderboardSize(guild.id),
        page,
        limit,
        members: levels
          .leaderboard(guild.id, limit, page * limit)
          .map((member) => ({ ...member, progress: progressFor(member.xp, curve) })),
      };
    },
  );

  app.post(
    '/levels/members/:userId/adjust',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action'],
          additionalProperties: false,
          properties: {
            action: { enum: [...levels.XP_ACTIONS] },
            amount: { type: 'integer', minimum: 0, maximum: 1_000_000_000 },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const { userId } = request.params as { userId: string };
      const { action, amount = 0 } = request.body as { action: XpAction; amount?: number };
      const member = await app.discord.guildMember(guild.id, userId);
      if (!member) throw new HttpError(404, 'unknown_member');
      if (member.bot) throw new HttpError(422, 'bot_member');

      const gain = levels.adjust(guild.id, member, action, amount);
      audit.record(guild.id, viewer.session.userId, 'levelMembers.adjust', {
        source: 'web',
        userId,
        action,
        amount,
      });
      return { ok: true, xp: gain.xp, level: gain.after };
    },
  );

  app.post('/levels/reset', async (request) => {
    const { guild, viewer } = scope(request);
    const count = levels.resetAll(guild.id);
    audit.record(guild.id, viewer.session.userId, 'levelMembers.resetAll', {
      source: 'web',
      count,
    });
    return { ok: true, count };
  });
}
