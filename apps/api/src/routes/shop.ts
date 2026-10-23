// Shop items, server roles and the income each role pays with /collect.
import { audit, roleRewards, shop } from '@monolith/core';
import type { FastifyInstance } from 'fastify';
import type { GuildRole } from '../discord.ts';
import { HttpError, indexParam } from '../http.ts';
import { scope } from './scope.ts';

/** Roles the bot could give: not @everyone and not managed by an integration. */
const assignable = (guildId: string, roles: GuildRole[]): GuildRole[] =>
  roles.filter((role) => role.id !== guildId && !role.managed);

export async function shopRoutes(app: FastifyInstance): Promise<void> {
  async function assignableRole(guildId: string, roleId: string): Promise<GuildRole> {
    const role = assignable(guildId, await app.discord.guildRoles(guildId)).find(
      (candidate) => candidate.id === roleId,
    );
    if (!role) throw new HttpError(422, 'invalid_role');
    return role;
  }

  app.get('/roles', async (request) => {
    const { guild } = scope(request);
    return { roles: assignable(guild.id, await app.discord.guildRoles(guild.id)) };
  });

  app.get('/shop', async (request) => {
    const { guild } = scope(request);
    return { items: shop.listProducts(guild.id) };
  });

  app.post(
    '/shop',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'price', 'consumable'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 50 },
            price: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
            description: { type: ['string', 'null'], maxLength: 200 },
            consumable: { type: 'boolean' },
            roleId: { type: ['string', 'null'], pattern: '^\\d{17,20}$' },
          },
        },
      },
    },
    async (request, reply) => {
      const { guild, viewer } = scope(request);
      const input = request.body as {
        name: string;
        price: number;
        description?: string | null;
        consumable: boolean;
        roleId?: string | null;
      };
      const name = input.name.trim();
      if (!name) throw new HttpError(422, 'name_required');
      if (shop.findProductByName(guild.id, name)) throw new HttpError(409, 'item_exists');
      if (input.roleId) await assignableRole(guild.id, input.roleId);

      const item = shop.addProduct(guild.id, { ...input, name });
      audit.record(guild.id, viewer.session.userId, 'shop.add', {
        source: 'web',
        id: item.id,
        name,
      });
      return reply.status(201).send({ item });
    },
  );

  app.delete('/shop/:itemId', async (request) => {
    const { guild, viewer } = scope(request);
    const id = indexParam(request.params, 'itemId');
    const item = shop.getProduct(guild.id, id);
    if (!item || !shop.removeProduct(guild.id, id)) throw new HttpError(404, 'unknown_item');
    audit.record(guild.id, viewer.session.userId, 'shop.remove', {
      source: 'web',
      id,
      name: item.name,
    });
    return { ok: true };
  });

  app.get('/role-income', async (request) => {
    const { guild } = scope(request);
    return { rewards: roleRewards.list(guild.id) };
  });

  app.put(
    '/role-income/:roleId',
    {
      schema: {
        body: {
          type: 'object',
          required: ['amount'],
          properties: { amount: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER } },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const { roleId } = request.params as { roleId: string };
      const { amount } = request.body as { amount: number };
      // Income can be tied to any role except @everyone, including bot-managed ones.
      const roles = await app.discord.guildRoles(guild.id);
      if (roleId === guild.id || !roles.some((role) => role.id === roleId)) {
        throw new HttpError(422, 'invalid_role');
      }
      roleRewards.set(guild.id, roleId, amount);
      audit.record(guild.id, viewer.session.userId, 'collect.set', {
        source: 'web',
        roleId,
        amount,
      });
      return { ok: true };
    },
  );

  app.delete('/role-income/:roleId', async (request) => {
    const { guild, viewer } = scope(request);
    const { roleId } = request.params as { roleId: string };
    if (!roleRewards.remove(guild.id, roleId)) throw new HttpError(404, 'unknown_role');
    audit.record(guild.id, viewer.session.userId, 'collect.remove', { source: 'web', roleId });
    return { ok: true };
  });
}
