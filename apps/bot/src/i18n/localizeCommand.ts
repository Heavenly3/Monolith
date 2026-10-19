import {
  ApplicationCommandOptionType,
  Locale,
  type APIApplicationCommandOption,
  type LocalizationMap,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { Language } from '@spacebet/i18n';
import { commandsEs, type CommandTexts } from './commands.es.ts';

// Discord locales that receive each translation file.
const TARGETS: { locales: (keyof LocalizationMap)[]; texts: Record<string, CommandTexts> }[] = [
  { locales: [Locale.SpanishES, Locale.SpanishLATAM], texts: commandsEs },
];

/** Discord locale used to read back the description in a bot language. */
export const DISCORD_LOCALE: Record<Language, keyof LocalizationMap | null> = {
  en: null,
  es: Locale.SpanishES,
};

type Localizable = { description_localizations?: LocalizationMap | null };

function addDescription(
  target: Localizable,
  locales: (keyof LocalizationMap)[],
  text?: string,
): void {
  if (!text) return;
  target.description_localizations = { ...target.description_localizations };
  for (const locale of locales) target.description_localizations[locale] = text;
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
      addDescription(option, locales, entry?.description);
      localizeOptions('options' in option ? option.options : undefined, entry, locales);
      continue;
    }
    addDescription(option, locales, texts?.options?.[option.name]);
    if ('choices' in option && option.choices) {
      for (const choice of option.choices) {
        const text = texts?.choices?.[option.name]?.[String(choice.value)];
        if (!text) continue;
        choice.name_localizations = { ...choice.name_localizations };
        for (const locale of locales) choice.name_localizations[locale] = text;
      }
    }
  }
}

/** Adds the description and choice translations to a command payload. */
export function localizeCommand(
  json: RESTPostAPIChatInputApplicationCommandsJSONBody,
): RESTPostAPIChatInputApplicationCommandsJSONBody {
  const result = structuredClone(json);
  for (const { locales, texts } of TARGETS) {
    const entry = texts[result.name];
    addDescription(result, locales, entry?.description);
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
