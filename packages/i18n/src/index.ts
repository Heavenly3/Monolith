import { en, type Messages } from './locales/en.ts';
import { es } from './locales/es.ts';

export type { Messages };

export const LOCALES = { en, es } satisfies Record<string, Messages>;
export type Language = keyof typeof LOCALES;
export const LANGUAGES = Object.keys(LOCALES) as Language[];
export const FALLBACK_LANGUAGE: Language = 'en';

export type Vars = Record<string, unknown>;

/** Translator bound to one language. */
export interface Translator {
  (key: string, vars?: Vars): string;
  /** Entries that are lists of strings (e.g. default job messages). */
  list(key: string): string[];
  readonly lang: Language;
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && value in LOCALES;
}

function lookup(dictionary: unknown, key: string): unknown {
  let node = dictionary;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function resolve(lang: Language, key: string): unknown {
  return lookup(LOCALES[lang], key) ?? lookup(LOCALES[FALLBACK_LANGUAGE], key);
}

/**
 * Translates a dot-path key, falling back to English and then to the key
 * itself. Entries may be strings with {placeholders} or functions of the vars.
 */
export function translate(lang: Language, key: string, vars: Vars = {}): string {
  const entry = resolve(lang, key);
  if (typeof entry === 'function') return String(entry(vars));
  if (typeof entry !== 'string') return key;
  return entry.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function translator(lang: Language): Translator {
  const t = ((key: string, vars?: Vars) => translate(lang, key, vars)) as Translator;
  t.list = (key) => {
    const entry = resolve(lang, key);
    return Array.isArray(entry) ? [...(entry as string[])] : [];
  };
  Object.defineProperty(t, 'lang', { value: lang });
  return t;
}

/** Maps a Discord locale ("es-ES", "es-419", "en-US"...) to a supported language. */
export function fromLocale(locale: string | null | undefined): Language {
  const base = String(locale ?? '').split('-')[0];
  return isLanguage(base) ? base : FALLBACK_LANGUAGE;
}
