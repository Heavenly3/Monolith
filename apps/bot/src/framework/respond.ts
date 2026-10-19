import type { InteractionReplyOptions, RepliableInteraction } from 'discord.js';
import type { ComponentInteraction } from './types.ts';

/** Replies, or follows up if the interaction was already answered. */
export async function respond(
  interaction: RepliableInteraction,
  payload: InteractionReplyOptions,
): Promise<unknown> {
  if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
  return interaction.reply(payload);
}

/** Resolves after `ms` milliseconds (for small UI animations). */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Value picked in a select menu, if the interaction is one. */
export function selectedValue(interaction: ComponentInteraction): string | undefined {
  return interaction.isAnySelectMenu() ? interaction.values[0] : undefined;
}
