import {
  ApplicationCommandOptionType,
  Locale,
  type APIApplicationCommandOption,
  type LocalizationMap,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { Language } from '@monolith/i18n';
import { commandsEs, type CommandTexts, type OptionTexts } from './commands.es.ts';

// Discord locales that receive each translation file.
const TARGETS: { locales: (keyof LocalizationMap)[]; texts: Record<string, CommandTexts> }[] = [
  { locales: [Locale.SpanishES, Locale.SpanishLATAM], texts: commandsEs },
];

/** Discord locale used to read back the texts in a bot language. */
export const DISCORD_LOCALE: Record<Language, keyof LocalizationMap | null> = {
  en: null,
  es: Locale.SpanishES,
};

type Localizable = {
  name_localizations?: LocalizationMap | null;
  description_localizations?: LocalizationMap | null;
};

function add(
  target: Localizable,
  field: 'name_localizations' | 'description_localizations',
  locales: (keyof LocalizationMap)[],
  text?: string,
): void {
  if (!text) return;
  target[field] = { ...target[field] };
  for (const locale of locales) target[field][locale] = text;
}

function addTexts(
  target: Localizable,
  locales: (keyof LocalizationMap)[],
  texts?: OptionTexts | CommandTexts,
): void {
  add(target, 'name_localizations', locales, texts?.name);
  add(target, 'description_localizations', locales, texts?.description);
}

const isContainer = (option: APIApplicationCommandOption): boolean =>
  option.type === ApplicationCommandOptionType.Subcommand ||
  option.type === ApplicationCommandOptionType.SubcommandGroup;

function localizeOptions(
  options: APIApplicationCommandOption[] | undefined,
  texts: CommandTexts | undefined,
  locales: (keyof LocalizationMap)[],
): void {
  for (const option of options ?? []) {
    if (isContainer(option)) {
      const entry = texts?.subcommands?.[option.name];
      addTexts(option, locales, entry);
      localizeOptions('options' in option ? option.options : undefined, entry, locales);
      continue;
    }
    const entry = texts?.options?.[option.name];
    addTexts(option, locales, entry);
    if ('choices' in option && option.choices) {
      for (const choice of option.choices) {
        add(choice, 'name_localizations', locales, entry?.choices?.[String(choice.value)]);
      }
    }
  }
}

/** Adds the name, description and choice translations to a command payload. */
export function localizeCommand(
  json: RESTPostAPIChatInputApplicationCommandsJSONBody,
): RESTPostAPIChatInputApplicationCommandsJSONBody {
  const result = structuredClone(json);
  for (const { locales, texts } of TARGETS) {
    const entry = texts[result.name];
    addTexts(result, locales, entry);
    localizeOptions(result.options, entry, locales);
  }
  return result;
}

/** Description of a command node in a bot language (falls back to English). */
export function describe(
  node: { description: string; description_localizations?: LocalizationMap | null },
  lang: Language,
): string {
  const locale = DISCORD_LOCALE[lang];
  return (locale && node.description_localizations?.[locale]) || node.description;
}

/** Name of a command node in a bot language (falls back to English). */
export function localName(
  node: { name: string; name_localizations?: LocalizationMap | null },
  lang: Language,
): string {
  const locale = DISCORD_LOCALE[lang];
  return (locale && node.name_localizations?.[locale]) || node.name;
}
