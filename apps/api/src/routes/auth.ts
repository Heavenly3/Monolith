// Discord login (OAuth2 authorization code flow) and the logged-in person.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { accounts, webSessions } from '@monolith/core';
import type { FastifyInstance } from 'fastify';
import { SESSION_COOKIE } from '../access.ts';

const STATE_COOKIE = 'mn_oauth_state';

const sameText = (a: string, b: string): boolean =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const { config, discord } = app;
  const secure = config.apiUrl.startsWith('https://');
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure, path: '/' } as const;

  app.get('/auth/login', async (_request, reply) => {
    const state = randomBytes(16).toString('base64url');
    reply.setCookie(STATE_COOKIE, state, { ...cookieOptions, maxAge: 600 });
    return reply.redirect(discord.authorizeUrl(state));
  });

  app.get('/auth/callback', async (request, reply) => {
    const { code, state } = request.query as { code?: string; state?: string };
    const expected = request.cookies[STATE_COOKIE];
    reply.clearCookie(STATE_COOKIE, { path: '/' });
    if (!code || !state || !expected || !sameText(state, expected)) {
      return reply.redirect(`${config.webUrl}/?login=failed`);
    }

    try {
      const accessToken = await discord.exchangeCode(code);
      const user = await discord.currentUser(accessToken);
      const username = user.globalName ?? user.username;
      // Lets the change history show who made each change.
      accounts.rememberProfile({ id: user.id, username: user.username });
      const token = webSessions.create({ id: user.id, username, avatar: user.avatar }, accessToken);
      reply.setCookie(SESSION_COOKIE, token, {
        ...cookieOptions,
        maxAge: webSessions.SESSION_TTL / 1000,
      });
      return reply.redirect(config.webUrl);
    } catch (error) {
      request.log.warn({ err: error }, 'Discord login failed');
      return reply.redirect(`${config.webUrl}/?login=failed`);
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) webSessions.destroy(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/api/me', async (request) => {
    const { session } = app.access.viewer(request);
    return { id: session.userId, username: session.username, avatar: session.avatar };
  });

  app.get('/api/guilds', async (request) => {
    const viewer = app.access.viewer(request);
    const { fresh } = request.query as { fresh?: string };
    const guilds = await app.access.guilds(viewer, { fresh: fresh === '1' });
    return {
      guilds: guilds.map(({ id, name, icon, hasBot }) => ({ id, name, icon, hasBot })),
      inviteUrl: `https://discord.com/oauth2/authorize?client_id=${config.clientId}&scope=bot+applications.commands&permissions=268435456`,
    };
  });
}
