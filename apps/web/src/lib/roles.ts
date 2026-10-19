import { computed } from 'vue';
import { api, guildPath } from './api.ts';
import { useLoader } from './composables.ts';
import type { Role } from './types.ts';

/** Roles the bot can give in a server, plus a lookup by ID. */
export function useRoles(guildId: string) {
  const loader = useLoader(() => api.get<{ roles: Role[] }>(guildPath(guildId, '/roles')));
  const roles = computed(() => loader.data.value?.roles ?? []);
  const byId = computed(() => new Map(roles.value.map((role) => [role.id, role])));
  return { ...loader, roles, byId };
}
