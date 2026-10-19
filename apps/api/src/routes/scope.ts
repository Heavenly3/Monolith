import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DashboardGuild, Viewer } from '../access.ts';

export interface GuildScope {
  viewer: Viewer;
  guild: DashboardGuild;
}

declare module 'fastify' {
  interface FastifyRequest {
    guildScope: GuildScope | null;
  }
}

/** Checks access to the server in the URL before any route of `app` runs. */
export function protectGuildRoutes(app: FastifyInstance): void {
  app.decorateRequest('guildScope', null);
  app.addHook('preValidation', async (request) => {
    request.guildScope = await app.access.guild(request);
  });
}

/** The checked server of a request (only inside protected routes). */
export function scope(request: FastifyRequest): GuildScope {
  if (!request.guildScope) throw new Error('Route is not protected by protectGuildRoutes');
  return request.guildScope;
}
