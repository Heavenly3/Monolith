import { accounts, audit, closeDatabase, openDatabase, settings, shop, work } from '@mythcore/core';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.ts';
import type { DiscordApi, DiscordUser, UserGuild } from '../src/discord.ts';
import type { ApiConfig } from '../src/env.ts';

const ADMIN_GUILD = '100000000000000001';
const MEMBER_GUILD = '100000000000000002';
const NO_BOT_GUILD = '100000000000000003';
const ROLE = '200000000000000001';
const MANAGED_ROLE = '200000000000000002';
const ALICE = '300000000000000001';
const BOB = '300000000000000002';
const BOT = '300000000000000009';

const config: ApiConfig = {
  clientId: 'client',
  clientSecret: 'secret',
  botToken: 'token',
  port: 0,
  apiUrl: 'http://api.test',
  webUrl: 'http://web.test',
  databasePath: ':memory:',
};

const users: Record<string, DiscordUser> = {
  [ALICE]: { id: ALICE, username: 'alice', globalName: 'Alice', avatar: null, bot: false },
  [BOB]: { id: BOB, username: 'bob', globalName: null, avatar: null, bot: false },
  [BOT]: { id: BOT, username: 'mythcore', globalName: null, avatar: null, bot: true },
};

const fakeDiscord: DiscordApi = {
  authorizeUrl: (state) => `https://discord.test/authorize?state=${state}`,
  exchangeCode: async (code) => {
    if (code !== 'good-code') throw new Error('bad code');
    return 'access-token';
  },
  currentUser: async () => users[ALICE]!,
  userGuilds: async (): Promise<UserGuild[]> => [
    { id: ADMIN_GUILD, name: 'Realm', icon: null, canManage: true },
    { id: NO_BOT_GUILD, name: 'Empty', icon: null, canManage: true },
  ],
  botGuildIds: async () => new Set([ADMIN_GUILD, MEMBER_GUILD]),
  guildRoles: async (guildId) => [
    { id: ROLE, name: 'Knight', color: 0, position: 2, managed: false },
    { id: MANAGED_ROLE, name: 'Bot role', color: 0, position: 1, managed: true },
    { id: guildId, name: '@everyone', color: 0, position: 0, managed: false },
  ],
  guildMember: async (_guildId, userId) => users[userId] ?? null,
};

let app: FastifyInstance;
let cookie: string;

/** Sends a request as Alice, from the dashboard. */
function call(method: InjectOptions['method'], url: string, payload?: object) {
  return app.inject({
    method,
    url,
    payload,
    headers: { cookie, origin: config.webUrl },
  });
}

const guildUrl = (path = '') => `/api/guilds/${ADMIN_GUILD}${path}`;

async function login(): Promise<string> {
  const start = await app.inject({ method: 'GET', url: '/auth/login' });
  const state = new URL(start.headers.location as string).searchParams.get('state')!;
  const stateCookie = start.cookies.find((c) => c.name === 'mc_oauth_state')!;
  const callback = await app.inject({
    method: 'GET',
    url: `/auth/callback?code=good-code&state=${state}`,
    cookies: { mc_oauth_state: stateCookie.value },
  });
  expect(callback.headers.location).toBe(config.webUrl);
  const session = callback.cookies.find((c) => c.name === 'mc_session')!;
  expect(session.httpOnly).toBe(true);
  return `mc_session=${session.value}`;
}

beforeEach(async () => {
  closeDatabase();
  settings.clearCache();
  openDatabase(':memory:');
  app = await buildApp({ config, discord: fakeDiscord });
  cookie = await login();
});

afterEach(() => app.close());

describe('login', () => {
  it('rejects a callback whose state does not match', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/callback?code=good-code&state=forged',
      cookies: { mc_oauth_state: 'real' },
    });
    expect(response.headers.location).toBe(`${config.webUrl}/?login=failed`);
    expect(response.cookies.some((c) => c.name === 'mc_session')).toBe(false);
  });

  it('knows who is logged in and logs out', async () => {
    expect((await call('GET', '/api/me')).json()).toMatchObject({ id: ALICE, username: 'Alice' });
    expect((await call('POST', '/auth/logout')).statusCode).toBe(200);
    expect((await call('GET', '/api/me')).statusCode).toBe(401);
  });

  it('requires a session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/me' });
    expect(response.statusCode).toBe(401);
  });
});

describe('access', () => {
  it('lists the servers the person manages and whether the bot is there', async () => {
    const { guilds } = (await call('GET', '/api/guilds')).json();
    expect(guilds).toEqual([
      { id: ADMIN_GUILD, name: 'Realm', icon: null, hasBot: true },
      { id: NO_BOT_GUILD, name: 'Empty', icon: null, hasBot: false },
    ]);
  });

  it('blocks servers the person cannot manage or the bot is not in', async () => {
    expect((await call('GET', `/api/guilds/${MEMBER_GUILD}/settings`)).statusCode).toBe(403);
    expect((await call('GET', `/api/guilds/${NO_BOT_GUILD}/settings`)).statusCode).toBe(404);
  });

  it('refuses changes that do not come from the dashboard', async () => {
    const response = await app.inject({
      method: 'POST',
      url: guildUrl('/wheel/reset'),
      headers: { cookie, origin: 'http://evil.test' },
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('settings', () => {
  it('validates and saves a category like /config does', async () => {
    const invalid = await call('PUT', guildUrl('/settings/work'), {
      values: { min: 500, max: 100, cooldown: '1h' },
    });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json()).toEqual({ error: 'invalid_rule', messageKey: 'config.minMax' });

    const saved = await call('PUT', guildUrl('/settings/work'), {
      values: { min: 100, max: 500, cooldown: '1h' },
    });
    expect(saved.statusCode).toBe(200);
    expect(settings.get(ADMIN_GUILD, 'work.range')).toEqual({ min: 100, max: 500 });
    expect(settings.get(ADMIN_GUILD, 'work.cooldown')).toBe(3600);
    expect(audit.recent(ADMIN_GUILD)[0]).toMatchObject({
      actorId: ALICE,
      action: 'settings.work.save',
    });

    const { categories } = (await call('GET', guildUrl('/settings'))).json();
    const workFields = categories.find((c: { id: string }) => c.id === 'work').fields;
    expect(workFields.find((f: { id: string }) => f.id === 'max')).toMatchObject({
      value: 500,
      custom: true,
    });
  });

  it('manages the jobs of /work', async () => {
    expect(
      (await call('POST', guildUrl('/work/messages'), { message: 'No reward' })).statusCode,
    ).toBe(422);
    const added = await call('POST', guildUrl('/work/messages?lang=es'), {
      message: 'Vendiste pan y ganaste {amount}.',
    });
    expect(added.statusCode).toBe(200);
    expect(work.getMessages(ADMIN_GUILD, []).at(-1)).toBe('Vendiste pan y ganaste {amount}.');
    expect((await call('DELETE', guildUrl('/work/messages/abc'))).statusCode).toBe(404);
  });
});

describe('members', () => {
  it('changes the gold of a member', async () => {
    const response = await call('POST', guildUrl(`/members/${BOB}/adjust`), {
      action: 'add',
      account: 'bank',
      amount: 2500,
    });
    expect(response.statusCode).toBe(200);
    expect(accounts.findAccount(ADMIN_GUILD, BOB)?.bank).toBe(2500);

    const { members, total } = (await call('GET', guildUrl('/members'))).json();
    expect(total).toBe(1);
    expect(members[0]).toMatchObject({ userId: BOB, username: 'bob', netWorth: 2500 });
  });

  it('refuses bots and missing amounts', async () => {
    const bot = await call('POST', guildUrl(`/members/${BOT}/adjust`), {
      action: 'add',
      account: 'wallet',
      amount: 10,
    });
    expect(bot.json()).toEqual({ error: 'bot_member' });
    const empty = await call('POST', guildUrl(`/members/${BOB}/adjust`), {
      action: 'add',
      account: 'wallet',
    });
    expect(empty.json()).toEqual({ error: 'amount_required' });
  });
});

describe('shop', () => {
  it('adds items with assignable roles only', async () => {
    const managed = await call('POST', guildUrl('/shop'), {
      name: 'Badge',
      price: 10,
      consumable: false,
      roleId: MANAGED_ROLE,
    });
    expect(managed.json()).toEqual({ error: 'invalid_role' });

    const created = await call('POST', guildUrl('/shop'), {
      name: 'Knighthood',
      price: 5000,
      consumable: false,
      roleId: ROLE,
    });
    expect(created.statusCode).toBe(201);
    const { item } = created.json();
    expect(shop.getProduct(ADMIN_GUILD, item.id)?.roleId).toBe(ROLE);

    expect((await call('POST', guildUrl('/shop'), { ...item, id: undefined })).statusCode).toBe(
      409,
    );
    expect((await call('DELETE', guildUrl(`/shop/${item.id}`))).statusCode).toBe(200);
    expect(shop.listProducts(ADMIN_GUILD)).toEqual([]);
  });

  it('only lists roles the bot could give', async () => {
    const { roles } = (await call('GET', guildUrl('/roles'))).json();
    expect(roles.map((role: { id: string }) => role.id)).toEqual([ROLE]);
  });
});
