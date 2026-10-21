import { inject, type InjectionKey, type Ref } from 'vue';
import type { GuildSummary } from './types.ts';

/** The server being managed, provided by GuildLayout to every page inside it. */
export const GUILD: InjectionKey<Ref<GuildSummary>> = Symbol('guild');

/** Set by SectionLayout: pages inside a section use a smaller title. */
export const IN_SECTION: InjectionKey<boolean> = Symbol('in-section');

export function useGuild(): Ref<GuildSummary> {
  const guild = inject(GUILD);
  if (!guild) throw new Error('useGuild() must be used inside GuildLayout');
  return guild;
}
