import { randomBytes } from 'node:crypto';
import {
  Events,
  PermissionsBitField,
  type Interaction,
  type RepliableInteraction,
} from 'discord.js';
import { accounts, logger, settings } from '@monolith/core';
import { translator, type Translator } from '@monolith/i18n';
import { defineEvent } from '../framework/loader.ts';
import { translatorFor } from '../framework/context.ts';
import { mention } from '../framework/mentions.ts';
import { respond } from '../framework/respond.ts';
import type { Context, LoadedCommand } from '../framework/types.ts';
import * as ui from '../ui/index.ts';

const log = logger.child('interactions');

async function handleError(
  interaction: RepliableInteraction,
  error: unknown,
  where: string,
  t: Translator,
) {
  // Short reference shown to the user and logged, to match reports to logs.
  const ref = randomBytes(3).toString('hex').toUpperCase();
  log.error(`[${ref}] Error in ${where} (user ${interaction.user.id}):`, error);
  try {
    await respond(interaction, ui.error(t('common.error', { ref })));
  } catch (replyError) {
    log.warn('Could not send the error message:', (replyError as Error).message);
  }
}

/** Admin-only commands also lock their buttons, menus and forms. */
function isAllowed(command: LoadedCommand, interaction: Interaction<'cached'>): boolean {
  if (!command.adminOnly) return true;
  const required = new PermissionsBitField(BigInt(command.json.default_member_permissions!));
  return interaction.memberPermissions.has(required);
}

/** False when the command belongs to a module the server turned off. */
const moduleOn = (command: LoadedCommand, guildId: string): boolean =>
  !command.module || settings.get(guildId, `modules.${command.module}`);

const moduleOff = (command: LoadedCommand, t: Translator) =>
  ui.info(
    t('common.moduleDisabled', {
      module: t(`modules.${command.module}`),
      command: mention('config'),
    }),
  );

/** customId format: `<command>:<action>:<arg>:<arg>...` */
function parseCustomId(customId: string): { commandName: string; action: string; args: string[] } {
  const [commandName = '', action = '', ...args] = customId.split(':');
  return { commandName, action, args };
}

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Every command is server-only (the economy belongs to a server).
    if (!interaction.inCachedGuild()) {
      if (interaction.isRepliable()) {
        await interaction.reply(ui.error(translator('en')('common.serverOnly')));
      }
      return;
    }

    const commands = interaction.client.commands;
    const t = translatorFor(interaction.guildId, interaction.locale);
    const ctx: Context = { t, lang: t.lang, guildId: interaction.guildId };

    if (interaction.isAutocomplete()) {
      try {
        const command = commands.get(interaction.commandName);
        if (command && !moduleOn(command, interaction.guildId))
          return await interaction.respond([]);
        await command?.autocomplete?.(interaction, ctx);
      } catch (error) {
        log.error(`Autocomplete error in /${interaction.commandName}:`, error);
        if (!interaction.responded) await interaction.respond([]).catch(() => {});
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) {
        log.warn(`Unknown command /${interaction.commandName}. Run "npm run deploy".`);
        return;
      }
      log.debug(
        `/${interaction.commandName} by ${interaction.user.id} in ${interaction.guildId} [${t.lang}]`,
      );
      accounts.rememberProfile(interaction.user, interaction.locale);
      if (!moduleOn(command, interaction.guildId)) {
        await interaction.reply(moduleOff(command, t));
        return;
      }
      try {
        await command.execute(interaction, ctx);
      } catch (error) {
        await handleError(interaction, error, `/${interaction.commandName}`, t);
      }
      return;
    }

    if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
      const { commandName, action, args } = parseCustomId(interaction.customId);
      const command = commands.get(commandName);
      const handler = command?.components?.[action];
      if (!command || !handler) {
        log.warn(`No component handler for "${interaction.customId}".`);
        return;
      }
      if (!isAllowed(command, interaction)) {
        await interaction.reply(ui.error(t('common.adminOnly')));
        return;
      }
      if (!moduleOn(command, interaction.guildId)) {
        await interaction.reply(moduleOff(command, t));
        return;
      }
      try {
        await handler(interaction, args, ctx);
      } catch (error) {
        await handleError(interaction, error, `component ${interaction.customId}`, t);
      }
    }
  },
});
