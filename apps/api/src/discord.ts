// Minimal Discord REST client: OAuth2 for the person logging in, and the bot
// token for what only the bot can see (its servers, roles and members).
import type { ApiConfig } from './env.ts';

const API = 'https://discord.com/api/v10';
const ADMINISTRATOR = 1n << 3n;

export interface DiscordUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  bot: boolean;
}

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  /** Owner or Administrator, the same people who can use /config. */
  canManage: boolean;
}

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface GuildChannel {
  id: string;
  name: string;
  /** 0 text, 2 voice, 5 announcement, 13 stage. */
  type: number;
  parentId: string | null;
  position: number;
}

export interface DiscordApi {
  authorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<string>;
  currentUser(accessToken: string): Promise<DiscordUser>;
  userGuilds(accessToken: string): Promise<UserGuild[]>;
  botGuildIds(): Promise<Set<string>>;
  guildRoles(guildId: string): Promise<GuildRole[]>;
  /** Text, announcement and voice channels, in the order Discord shows them. */
  guildChannels(guildId: string): Promise<GuildChannel[]>;
  guildMember(guildId: string, userId: string): Promise<DiscordUser | null>;
}

export class DiscordError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RawUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
  bot?: boolean;
}

const toUser = (raw: RawUser): DiscordUser => ({
  id: raw.id,
  username: raw.username,
  globalName: raw.global_name ?? null,
  avatar: raw.avatar,
  bot: raw.bot ?? false,
});

export function canManage(guild: { owner?: boolean; permissions?: string }): boolean {
  if (guild.owner) return true;
  return (BigInt(guild.permissions ?? '0') & ADMINISTRATOR) !== 0n;
}

export function createDiscordApi(config: ApiConfig): DiscordApi {
  const redirectUri = `${config.apiUrl}/auth/callback`;

  async function request<T>(route: string, init: RequestInit & { auth: string }): Promise<T> {
    const response = await fetch(`${API}${route}`, {
      ...init,
      headers: { Authorization: init.auth, ...init.headers },
    });
    if (!response.ok) {
      throw new DiscordError(response.status, `Discord ${route} failed (${response.status})`);
    }
    return (await response.json()) as T;
  }

  const bot = <T>(route: string) => request<T>(route, { auth: `Bot ${config.botToken}` });
  const user = <T>(route: string, token: string) => request<T>(route, { auth: `Bearer ${token}` });

  return {
    authorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'identify guilds',
        state,
        prompt: 'none',
      });
      return `https://discord.com/oauth2/authorize?${params}`;
    },

    async exchangeCode(code) {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });
      const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
      const token = await request<{ access_token: string }>('/oauth2/token', {
        method: 'POST',
        auth: `Basic ${basic}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      return token.access_token;
    },

    async currentUser(accessToken) {
      return toUser(await user<RawUser>('/users/@me', accessToken));
    },

    async userGuilds(accessToken) {
      const guilds = await user<
        { id: string; name: string; icon: string | null; owner?: boolean; permissions?: string }[]
      >('/users/@me/guilds', accessToken);
      return guilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        canManage: canManage(guild),
      }));
    },

    async botGuildIds() {
      const ids = new Set<string>();
      let after = '0';
      for (;;) {
        const page = await bot<{ id: string }[]>(`/users/@me/guilds?limit=200&after=${after}`);
        for (const guild of page) ids.add(guild.id);
        if (page.length < 200) return ids;
        after = page.at(-1)!.id;
      }
    },

    async guildRoles(guildId) {
      const roles = await bot<GuildRole[]>(`/guilds/${guildId}/roles`);
      return roles
        .map(({ id, name, color, position, managed }) => ({ id, name, color, position, managed }))
        .sort((a, b) => b.position - a.position);
    },

    async guildChannels(guildId) {
      const channels = await bot<
        { id: string; name: string; type: number; parent_id?: string | null; position: number }[]
      >(`/guilds/${guildId}/channels`);
      return channels
        .filter((channel) => [0, 2, 5, 13].includes(channel.type))
        .map(({ id, name, type, parent_id, position }) => ({
          id,
          name,
          type,
          parentId: parent_id ?? null,
          position,
        }))
        .sort((a, b) => a.position - b.position);
    },

    async guildMember(guildId, userId) {
      try {
        const member = await bot<{ user: RawUser }>(`/guilds/${guildId}/members/${userId}`);
        return toUser(member.user);
      } catch (error) {
        if (error instanceof DiscordError && error.status === 404) return null;
        throw error;
      }
    },
  };
}
