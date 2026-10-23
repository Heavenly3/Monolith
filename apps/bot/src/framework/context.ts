import { settings } from '@monolith/core';
import { fromLocale, translator, type Language, type Translator } from '@monolith/i18n';

/**
 * Language used to talk to someone in a server: the server setting, or
 * their own Discord language when the setting is "auto".
 */
export function resolveLanguage(guildId: string, locale: string | null | undefined): Language {
  const configured = settings.get(guildId, 'general.language');
  return configured === 'auto' ? fromLocale(locale) : configured;
}

export function translatorFor(guildId: string, locale: string | null | undefined): Translator {
  return translator(resolveLanguage(guildId, locale));
}
