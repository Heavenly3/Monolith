// Readable descriptions of audit log entries, shared by the history page and
// the overview's latest changes.
import { has, t } from '../i18n/index.ts';
import type { AuditEntry } from './types.ts';

// Sections named in actions from the bot ("config.work.save") and the dashboard
// ("settings.work.save", "shop.add"), mapped to readable names.
const SECTION_NAMES: Record<string, string> = {
  shop: 'web.nav.shop',
  members: 'web.nav.members',
  loans: 'web.nav.loans',
};

function sectionName(section: string): string {
  if (has(`config.categories.${section}.label`)) return t(`config.categories.${section}.label`);
  return SECTION_NAMES[section] ? t(SECTION_NAMES[section]) : section;
}

// Actions of the bot's /config panel that mean the same as a dashboard action.
const VERB_ALIASES: Record<string, string> = {
  saveItem: 'add',
  saveMessage: 'add',
  savePrize: 'add',
  saveRole: 'set',
  resetPrizes: 'reset',
  language: 'save',
};

/** "settings.work.save" → "Saved Work". */
export function describeAudit(entry: AuditEntry): string {
  const parts = entry.action.split('.');
  const last = parts.at(-1) ?? '';
  const verb = VERB_ALIASES[last] ?? last;
  const section = parts.length > 2 ? parts.at(-2)! : (parts[0] ?? '');
  const key = `web.history.actions.${verb}`;
  return has(key)
    ? t(key, { section: sectionName(section) })
    : t('web.history.actions.other', { action: entry.action });
}

export const fromWeb = (entry: AuditEntry): boolean => entry.details?.source === 'web';
