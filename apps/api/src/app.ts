import cookie from '@fastify/cookie';
import staticFiles from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { access, type Access } from './access.ts';
import { authRoutes } from './routes/auth.ts';
import { economyRoutes } from './routes/economy.ts';
import { levelRoutes } from './routes/levels.ts';
import { settingsRoutes } from './routes/settings.ts';
import { protectGuildRoutes } from './routes/scope.ts';
import { shopRoutes } from './routes/shop.ts';
import { DiscordError, type DiscordApi } from './discord.ts';
import { HttpError } from './http.ts';
import type { ApiConfig } from './env.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: ApiConfig;
    discord: DiscordApi;
    access: Access;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface AppOptions {
  config: ApiConfig;
  discord: DiscordApi;
  logger?: boolean;
  /** Built dashboard (apps/web/dist) to serve next to the API, if any. */
  webDir?: string | null;
}

export async function buildApp({
  config,
  discord,
  logger = false,
  webDir = null,
}: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger,
    trustProxy: true,
    // Schemas use type lists such as ['string', 'null'].
    ajv: { customOptions: { allowUnionTypes: true } },
  });
  app.decorate('config', config);
  app.decorate('discord', discord);
  app.decorate('access', access(discord));
  await app.register(cookie);

  // Cookies are sent with cross-site requests too, so every change must come
  // from the dashboard itself.
  const allowedOrigins = new Set([config.webUrl, config.apiUrl]);
  app.addHook('onRequest', async (request) => {
    if (SAFE_METHODS.has(request.method)) return;
    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.has(origin)) throw new HttpError(403, 'bad_origin');
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.status).send({ error: error.code, ...error.details });
    }
    if (error instanceof DiscordError) {
      // An expired Discord login means the person must sign in again.
      if (error.status === 401) return reply.status(401).send({ error: 'unauthorized' });
      request.log.warn(error.message);
      return reply.status(502).send({ error: 'discord_unavailable' });
    }
    const status = (error as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply
        .status(status)
        .send({ error: 'invalid_request', message: (error as Error).message });
    }
    request.log.error(error);
    return reply.status(500).send({ error: 'internal' });
  });

  app.get('/health', async () => ({ ok: true }));
  await app.register(authRoutes);
  await app.register(
    async (guild) => {
      protectGuildRoutes(guild);
      await guild.register(settingsRoutes);
      await guild.register(economyRoutes);
      await guild.register(shopRoutes);
      await guild.register(levelRoutes);
    },
    { prefix: '/api/guilds/:guildId' },
  );

  if (webDir) {
    // One process serves the dashboard and its API. Unknown paths load the
    // app, which has its own router; unknown API paths stay JSON 404s.
    await app.register(staticFiles, { root: webDir, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      const apiPath = /^\/(api|auth)(\/|$)/.test(request.url);
      if (request.method !== 'GET' || apiPath) {
        return reply.status(404).send({ error: 'not_found' });
      }
      return reply.sendFile('index.html');
    });
  }
  return app;
}
