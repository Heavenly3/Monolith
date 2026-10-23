// Overview of a server, members' credits, loans and the change history.
import {
  accounts,
  audit,
  loans,
  raffle,
  shop,
  type BalanceImportMode,
  type BalanceRecord,
  type MoneyAction,
} from '@monolith/core';
import type { FastifyInstance } from 'fastify';
import { HttpError } from '../http.ts';
import { scope } from './scope.ts';

const USER_ID = /^\d{17,20}$/;

function userIdParam(params: unknown): string {
  const { userId } = params as { userId?: string };
  if (!userId || !USER_ID.test(userId)) throw new HttpError(404, 'unknown_member');
  return userId;
}

export async function economyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (request) => {
    const { guild } = scope(request);
    const round = raffle.getRound(guild.id);
    return {
      guild: { id: guild.id, name: guild.name, icon: guild.icon },
      stats: accounts.stats(guild.id),
      top: accounts.leaderboard(guild.id, 5),
      activeLoans: loans.listLoans(guild.id).length,
      products: shop.listProducts(guild.id).length,
      raffle: { pot: round.pot, drawAt: round.drawAt, tickets: raffle.ticketCount(guild.id) },
    };
  });

  app.get(
    '/members',
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
      return {
        total: accounts.leaderboardSize(guild.id),
        page,
        limit,
        members: accounts.leaderboard(guild.id, limit, page * limit),
      };
    },
  );

  app.get('/members/:userId', async (request) => {
    const { guild } = scope(request);
    const userId = userIdParam(request.params);
    const account = accounts.findAccount(guild.id, userId);
    return {
      userId,
      username: accounts.getProfile(userId)?.username ?? null,
      wallet: account?.wallet ?? 0,
      bank: account?.bank ?? 0,
      rank: accounts.rankOf(guild.id, userId),
      loan: loans.getLoan(guild.id, userId),
      inventory: shop.getInventory(guild.id, userId),
    };
  });

  app.post(
    '/members/:userId/adjust',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action', 'account'],
          properties: {
            action: { enum: [...accounts.MONEY_ACTIONS] },
            account: { enum: ['wallet', 'bank'] },
            amount: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const userId = userIdParam(request.params);
      const {
        action,
        account,
        amount = 0,
      } = request.body as {
        action: MoneyAction;
        account: 'wallet' | 'bank';
        amount?: number;
      };
      if (action !== 'reset' && action !== 'set' && amount === 0) {
        throw new HttpError(422, 'amount_required');
      }

      const member = await app.discord.guildMember(guild.id, userId);
      if (!member) throw new HttpError(404, 'unknown_member');
      if (member.bot) throw new HttpError(422, 'bot_member');

      const result = accounts.adjust(guild.id, member, action, account, amount);
      audit.record(guild.id, viewer.session.userId, 'members.adjust', {
        source: 'web',
        userId,
        action,
        account,
        amount: result.amount,
      });
      return result;
    },
  );

  app.get('/loans', async (request) => {
    const { guild } = scope(request);
    return {
      loans: loans.listLoans(guild.id).map((loan) => ({
        ...loan,
        username: accounts.getProfile(loan.userId)?.username ?? null,
      })),
    };
  });

  app.delete('/loans/:userId', async (request) => {
    const { guild, viewer } = scope(request);
    const userId = userIdParam(request.params);
    if (!loans.cancel(guild.id, userId)) throw new HttpError(404, 'unknown_loan');
    audit.record(guild.id, viewer.session.userId, 'loans.cancel', { source: 'web', userId });
    return { ok: true };
  });

  app.get(
    '/members/export',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { format: { enum: ['json', 'csv'], default: 'json' } },
        },
      },
    },
    async (request, reply) => {
      const { guild } = scope(request);
      const { format } = request.query as { format: 'json' | 'csv' };
      const rows = accounts.exportAll(guild.id);
      const name = `economy-${guild.id}-${new Date().toISOString().slice(0, 10)}.${format}`;
      reply.header('content-disposition', `attachment; filename="${name}"`);
      if (format === 'json') {
        reply.type('application/json');
        return JSON.stringify(
          {
            guildId: guild.id,
            exportedAt: new Date().toISOString(),
            members: rows.map(({ rank, userId, username, wallet, bank, netWorth }) => ({
              rank,
              userId,
              username,
              wallet,
              bank,
              total: netWorth,
            })),
          },
          null,
          2,
        );
      }
      const cell = (value: string | null) => `"${(value ?? '').replaceAll('"', '""')}"`;
      const lines = rows.map((r) =>
        [r.rank, r.userId, cell(r.username), r.wallet, r.bank, r.netWorth].join(','),
      );
      reply.type('text/csv; charset=utf-8');
      return ['rank,userId,username,wallet,bank,total', ...lines].join('\n');
    },
  );

  app.post(
    '/members/import',
    {
      bodyLimit: 16 * 1024 * 1024,
      schema: {
        body: {
          type: 'object',
          required: ['mode', 'records'],
          additionalProperties: false,
          properties: {
            mode: { enum: [...accounts.IMPORT_MODES] },
            records: {
              type: 'array',
              maxItems: accounts.MAX_IMPORT,
              items: {
                type: 'object',
                required: ['userId', 'wallet', 'bank'],
                properties: {
                  userId: { type: 'string', pattern: '^\\d{17,20}$' },
                  wallet: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
                  bank: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
                },
              },
            },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const { mode, records } = request.body as {
        mode: BalanceImportMode;
        records: BalanceRecord[];
      };
      const count = accounts.importBalances(guild.id, records, mode);
      audit.record(guild.id, viewer.session.userId, 'members.import', {
        source: 'web',
        mode,
        count,
      });
      return { ok: true, count };
    },
  );

  app.post('/members/reset', async (request) => {
    const { guild, viewer } = scope(request);
    const count = accounts.resetAll(guild.id);
    audit.record(guild.id, viewer.session.userId, 'members.resetAll', { source: 'web', count });
    return { ok: true, count };
  });

  app.delete('/loans', async (request) => {
    const { guild, viewer } = scope(request);
    const count = loans.cancelAll(guild.id);
    audit.record(guild.id, viewer.session.userId, 'loans.cancelAll', { source: 'web', count });
    return { ok: true, count };
  });

  app.get(
    '/audit',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
        },
      },
    },
    async (request) => {
      const { guild } = scope(request);
      const { limit } = request.query as { limit: number };
      return {
        entries: audit.recent(guild.id, limit).map((entry) => ({
          ...entry,
          actorName: accounts.getProfile(entry.actorId)?.username ?? null,
        })),
      };
    },
  );
}
