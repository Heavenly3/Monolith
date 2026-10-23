import { computed } from 'vue';
import { api, guildPath } from './api.ts';
import { useLoader } from './composables.ts';
import type { Channel } from './types.ts';

const TEXT_TYPES = new Set([0, 5]);
const CATEGORY = 4;

/** Channels of a server; text ones for announcements and filters. */
export function useChannels(guildId: string) {
  const loader = useLoader(() => api.get<{ channels: Channel[] }>(guildPath(guildId, '/channels')));
  const channels = computed(() => loader.data.value?.channels ?? []);
  const textChannels = computed(() => channels.value.filter((c) => TEXT_TYPES.has(c.type)));
  const isCategory = (channel: Channel | undefined) => channel?.type === CATEGORY;
  const byId = computed(() => new Map(channels.value.map((channel) => [channel.id, channel])));
  return { ...loader, channels, textChannels, isCategory, byId };
}
