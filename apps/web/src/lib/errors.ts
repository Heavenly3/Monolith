import { t } from '../i18n/index.ts';
import { ApiError } from './api.ts';

// API error codes with a specific message; anything else gets a generic one.
const MESSAGES: Record<string, string> = {
  unauthorized: 'web.common.sessionExpired',
  discord_unavailable: 'web.common.discordDown',
  unknown_member: 'web.members.unknown',
  bot_member: 'web.members.bot',
  amount_required: 'web.members.amountRequired',
  item_exists: 'web.shop.exists',
  invalid_role: 'web.shop.invalidRole',
  missing_amount: 'web.jobs.needsAmount',
};

/** Message to show for a failed request. */
export function errorMessage(error: unknown, fallback = 'web.common.error'): string {
  if (error instanceof ApiError) {
    if (error.code === 'invalid_rule' && typeof error.details.messageKey === 'string') {
      return t(error.details.messageKey);
    }
    const key = MESSAGES[error.code];
    if (key) return t(key, error.details);
  }
  return t(fallback);
}
