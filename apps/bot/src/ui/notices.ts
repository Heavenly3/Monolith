import type { Translator } from '@spacebet/i18n';
import { Card, type CardMessage } from './card.ts';
import { emojis } from './emojis.ts';
import { relativeTime } from './format.ts';

const KINDS = {
  success: { color: 'success', icon: emojis.success },
  error: { color: 'danger', icon: emojis.error },
  warning: { color: 'warning', icon: emojis.warning },
  info: { color: 'info', icon: emojis.info },
} as const;

type Kind = keyof typeof KINDS;

/** Small single-line message. Private (ephemeral) by default. */
export function notice(kind: Kind, message: string, { ephemeral = true } = {}): CardMessage {
  const { color, icon } = KINDS[kind];
  return new Card(color).text(`${icon} ${message}`).toMessage({ ephemeral });
}

export const success = (message: string, options?: { ephemeral?: boolean }) =>
  notice('success', message, options);
export const error = (message: string, options?: { ephemeral?: boolean }) =>
  notice('error', message, options);
export const warning = (message: string, options?: { ephemeral?: boolean }) =>
  notice('warning', message, options);
export const info = (message: string, options?: { ephemeral?: boolean }) =>
  notice('info', message, options);

/** "You can work again in 5 minutes" with a live Discord timestamp. */
export function cooldown(t: Translator, remainingMs: number, action: string): CardMessage {
  return notice(
    'warning',
    `${emojis.cooldown} ${t('common.cooldown', { action, time: relativeTime(Date.now() + remainingMs) })}`,
  );
}
