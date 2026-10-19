// Checks what TypeScript cannot: every slash command, subcommand and option
// has a Spanish description within Discord's 100-character limit, and every
// command has a /help entry. (Locale files must already match: es is typed as
// the English `Messages` shape, so a missing key fails `npm run typecheck`.)
//   npm run check:i18n
import { ApplicationCommandOptionType, Locale, type APIApplicationCommandOption } from 'discord.js';
import { LOCALES } from '@spacebet/i18n';
import { loadCommands } from '../apps/bot/src/framework/loader.ts';

const LOCALE = Locale.SpanishES;
const problems: string[] = [];

function checkText(where: string, text: string | null | undefined): void {
  if (!text) problems.push(`missing Spanish text for ${where}`);
  else if (text.length > 100) problems.push(`${where} is ${text.length} characters (max 100)`);
}

function checkOptions(prefix: string, options: APIApplicationCommandOption[] | undefined): void {
  for (const option of options ?? []) {
    const where = `${prefix} ${option.name}`;
    checkText(where, option.description_localizations?.[LOCALE]);
    if (
      option.type === ApplicationCommandOptionType.Subcommand ||
      option.type === ApplicationCommandOptionType.SubcommandGroup
    ) {
      checkOptions(where, option.options);
      continue;
    }
    // Choices that are proper names (e.g. horses) may stay untranslated.
    for (const choice of 'choices' in option ? (option.choices ?? []) : []) {
      const text = choice.name_localizations?.[LOCALE];
      if (text && text.length > 100) problems.push(`choice ${where}=${choice.value} is too long`);
    }
  }
}

for (const command of (await loadCommands()).values()) {
  const { name } = command.json;
  checkText(`/${name}`, command.json.description_localizations?.[LOCALE]);
  checkOptions(`/${name}`, command.json.options);
  for (const [lang, messages] of Object.entries(LOCALES)) {
    const entry = (messages.help.commands as Record<string, { about?: string }>)[name];
    if (!entry?.about) problems.push(`[${lang}] missing help.commands.${name}.about`);
  }
}

if (problems.length) {
  console.error(`✖ ${problems.length} translation problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`✔ Translations complete (${Object.keys(LOCALES).join(', ')}).`);
