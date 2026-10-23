import { TimestampStyles, time } from 'discord.js';
import { formatNumber } from '@monolith/core';
import { emojis } from './emojis.ts';

/** `**1,250** 🪙` — the standard way to show money. */
export function coins(value: number): string {
  return `**${formatNumber(value)}** ${emojis.coin}`;
}

/** Live-updating Discord timestamp ("in 5 minutes"). */
export function relativeTime(date: number | Date): string {
  return time(new Date(date), TimestampStyles.RelativeTime);
}

export function fullTime(date: number | Date): string {
  return time(new Date(date), TimestampStyles.LongDateTime);
}

/** Zero-padded raffle ticket: 7 → `007`. */
export function ticket(number: number): string {
  return `\`${String(number).padStart(3, '0')}\``;
}

/** Text progress bar: 0.42 → `▰▰▰▰▰▱▱▱▱▱▱▱`. */
export function progressBar(ratio: number, size = 12): string {
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * size);
  return `\`${'▰'.repeat(filled)}${'▱'.repeat(size - filled)}\``;
}
