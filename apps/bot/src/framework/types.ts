import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { ModuleId, SettingKey } from '@mythcore/core';
import type { Language, Translator } from '@mythcore/i18n';

/** Passed to every handler. */
export interface Context {
  /** Translator in the language of the reply. */
  t: Translator;
  lang: Language;
  /** Every command runs inside a server: this is its economy. */
  guildId: string;
}

export type CommandInteraction = ChatInputCommandInteraction<'cached'>;
export type CommandAutocomplete = AutocompleteInteraction<'cached'>;
export type ComponentInteraction =
  MessageComponentInteraction<'cached'> | ModalSubmitInteraction<'cached'>;

export type ComponentHandler = (
  interaction: ComponentInteraction,
  args: string[],
  ctx: Context,
) => Promise<unknown>;

export interface CommandDefinition {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  /** Setting that holds its cooldown, shown in /help. */
  cooldown?: SettingKey;
  /** Module it belongs to; defaults to the module of its folder. */
  module?: ModuleId;
  execute(interaction: CommandInteraction, ctx: Context): Promise<unknown>;
  autocomplete?(interaction: CommandAutocomplete, ctx: Context): Promise<unknown>;
  /** Handlers for custom IDs shaped `<command>:<action>:<args...>`. */
  components?: Record<string, ComponentHandler>;
}

export interface LoadedCommand extends Omit<CommandDefinition, 'module'> {
  /** Folder the command lives in (economy, games...). */
  category: string;
  /** Final payload sent to Discord, translations included. */
  json: RESTPostAPIChatInputApplicationCommandsJSONBody;
  adminOnly: boolean;
  /** Module that must be turned on for the command to work, if any. */
  module: ModuleId | null;
}

/** Identity helper that gives command files full type checking. */
export function defineCommand(definition: CommandDefinition): CommandDefinition {
  return definition;
}

declare module 'discord.js' {
  interface Client {
    /** Loaded slash commands, by name. */
    commands: Map<string, LoadedCommand>;
  }
}
