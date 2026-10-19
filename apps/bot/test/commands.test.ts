import type { APIApplicationCommandOption, LocalizationMap } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { loadCommands } from '../src/framework/loader.ts';

// Discord rules for chat command and option names.
const NAME = /^[-_\p{Ll}\p{N}]{1,32}$/u;

type Node = {
  name: string;
  name_localizations?: LocalizationMap | null;
  options?: APIApplicationCommandOption[];
};

const namesOf = (node: Node): string[] => [
  node.name,
  ...Object.values(node.name_localizations ?? {}).filter((name): name is string => !!name),
];

function check(node: Node, path: string): void {
  for (const name of namesOf(node)) expect(name, path).toMatch(NAME);
  const options = node.options ?? [];
  // Names must be unique among siblings in every language.
  const locales = new Set(
    options.flatMap((option) => Object.keys(option.name_localizations ?? {})),
  );
  for (const locale of locales) {
    const localized = options.map(
      (option) => option.name_localizations?.[locale as keyof LocalizationMap] ?? option.name,
    );
    expect(new Set(localized).size, `${path} (${locale})`).toBe(localized.length);
  }
  for (const option of options) check(option as Node, `${path} ${option.name}`);
}

describe('slash commands', () => {
  it('have valid and unique names in every language', async () => {
    const commands = await loadCommands();
    for (const command of commands.values()) check(command.json as Node, `/${command.data.name}`);

    const spanish = [...commands.values()].map(
      (command) => command.json.name_localizations?.['es-ES'] ?? command.json.name,
    );
    expect(spanish).toContain('saldo');
    expect(new Set(spanish).size).toBe(spanish.length);
  });
});
