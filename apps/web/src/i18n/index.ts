import {
  LANGUAGES,
  fromLocale,
  isLanguage,
  translate,
  type Language,
  type Vars,
} from '@mythcore/i18n';
import { ref } from 'vue';
import { en } from './en.ts';
import { es } from './es.ts';

const WEB = { en, es };
const STORAGE_KEY = 'mythcore.lang';

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the browser language.
  }
  return fromLocale(navigator.language);
}

/** Current language of the dashboard. */
export const lang = ref<Language>(initialLanguage());
document.documentElement.lang = lang.value;

export function setLanguage(value: Language): void {
  lang.value = value;
  document.documentElement.lang = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Not saved; the choice still applies until the page is closed.
  }
}

export const languages = LANGUAGES;

function lookup(dictionary: unknown, key: string): unknown {
  let node = dictionary;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/**
 * Translates a key. Keys starting with "web." are dashboard texts; any other
 * key is shared with the bot (settings labels, feature names...).
 */
export function t(key: string, vars: Vars = {}): string {
  if (!key.startsWith('web.')) return translate(lang.value, key, vars);
  const path = key.slice(4);
  const entry = lookup(WEB[lang.value], path) ?? lookup(WEB.en, path);
  if (typeof entry !== 'string') return key;
  return entry.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** True when a key exists, so optional labels can be skipped. */
export function has(key: string): boolean {
  return t(key) !== key;
}
