import {
  ApplicationCommandOptionType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type APIApplicationCommandOption,
  type APIApplicationCommandSubcommandOption,
  type Client,
  type PermissionsBitField,
} from 'discord.js';
import {
  HORSERACE,
  KENO,
  MIN_BET,
  SETTING_CATEGORIES,
  SLOTS,
  formatDuration,
  settings,
  type SettingField,
} from '@mythcore/core';
import type { Language, Translator } from '@mythcore/i18n';
import { defineCommand, type Context, type LoadedCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import { selectedValue } from '../../framework/respond.ts';
import { describe, localName } from '../../i18n/localizeCommand.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, type ColorName, type EmojiName } from '../../ui/index.ts';
import { settingLines } from '../../ui/settings.ts';

// Sections of the guide: which command folder they list, their look and who sees them.
const SECTIONS: Record<
  string,
  { icon: EmojiName; color: ColorName; category?: string; adminOnly?: boolean }
> = {
  economy: { icon: 'money', color: 'economy', category: 'economy' },
  games: { icon: 'slots', color: 'slots', category: 'games' },
  loans: { icon: 'loan', color: 'loans', category: 'loans' },
  shop: { icon: 'shop', color: 'shop', category: 'shop' },
  levels: { icon: 'level', color: 'levels', category: 'levels' },
  admin: { icon: 'config', color: 'config', category: 'admin', adminOnly: true },
  config: { icon: 'description', color: 'config' },
};

const COMMAND_ICONS: Record<string, EmojiName> = {
  balance: 'wallet',
  deposit: 'deposit',
  withdraw: 'withdraw',
  pay: 'payment',
  work: 'work',
  collect: 'collect',
  wheel: 'wheel',
  rob: 'rob',
  leaderboard: 'rank',
  slots: 'slots',
  roulette: 'roulette',
  race: 'horse',
  keno: 'keno',
  lottery: 'raffle',
  loan: 'loan',
  shop: 'shop',
  buy: 'buy',
  use: 'consumable',
  inventory: 'inventory',
  help: 'help',
  config: 'config',
  rank: 'level',
  levels: 'rank',
};

// Game commands and the feature they belong to.
const GAME_FEATURES = { slots: 'slots', roulette: 'roulette', race: 'horserace', keno: 'keno' };

// Settings category of /config that affects each command.
const COMMAND_SETTINGS: Record<string, string> = {
  work: 'work',
  collect: 'collect',
  wheel: 'wheel',
  slots: 'games',
  roulette: 'games',
  race: 'games',
  keno: 'games',
  rob: 'games',
  loan: 'loans',
  rank: 'levels',
  levels: 'levels',
  lottery: 'raffle',
};

const icon = (name: string): string => emojis[COMMAND_ICONS[name] ?? 'help'];
const isAdmin = (permissions: Readonly<PermissionsBitField>): boolean =>
  permissions.has(PermissionFlagsBits.Administrator);

interface View {
  t: Translator;
  lang: Language;
  guildId: string;
  client: Client;
  admin: boolean;
}

const visibleSections = (admin: boolean) =>
  Object.entries(SECTIONS).filter(([, section]) => !section.adminOnly || admin);

function commandsOf(client: Client, category: string | undefined, admin: boolean): LoadedCommand[] {
  return [...client.commands.values()]
    .filter((command) => command.category === category && (admin || !command.adminOnly))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));
}

function subcommandsOf(
  options: APIApplicationCommandOption[] | undefined,
): APIApplicationCommandSubcommandOption[] {
  return (options ?? []).filter(
    (option): option is APIApplicationCommandSubcommandOption =>
      option.type === ApplicationCommandOptionType.Subcommand,
  );
}

/** Payout summary of a game, if the command is one. */
function payoutLine(t: Translator, name: string): string | null {
  switch (name) {
    case 'slots':
      return t('help.payouts.slots', SLOTS.payouts);
    case 'roulette':
      return t('help.payouts.roulette');
    case 'race': {
      const { 1: first, 2: second, 3: third } = HORSERACE.payouts;
      return t('help.payouts.horserace', { first, second, third });
    }
    case 'keno': {
      const max = Math.max(...Object.values(KENO.paytable).flatMap((row) => Object.values(row)));
      return t('help.payouts.keno', { max: max.toLocaleString('en-US') });
    }
    default:
      return null;
  }
}

function sectionMenu({ t, admin }: View, selected?: string) {
  return new StringSelectMenuBuilder()
    .setCustomId('help:section')
    .setPlaceholder(t('help.placeholder'))
    .addOptions(
      visibleSections(admin).map(([value, section]) => ({
        label: t(`help.sections.${value}.label`),
        description: t(`help.sections.${value}.description`),
        emoji: emojis[section.icon],
        value,
        default: value === selected,
      })),
    );
}

function commandMenu({ t, lang }: View, commands: LoadedCommand[], selected?: string) {
  if (!commands.length) return null;
  return new StringSelectMenuBuilder()
    .setCustomId('help:command')
    .setPlaceholder(t('help.commandPlaceholder'))
    .addOptions(
      commands.slice(0, 25).map((command) => ({
        label: `/${localName(command.json, lang)}`,
        description: describe(command.json, lang).slice(0, 100),
        emoji: icon(command.data.name),
        value: command.data.name,
        default: command.data.name === selected,
      })),
    );
}

function renderHome(view: View): ui.Card {
  const { t, admin, client } = view;
  const steps = t
    .list('help.home.steps')
    .map(
      (step, i) =>
        `${i + 1}. ${step
          .replace('{work}', mention('work'))
          .replace('{deposit}', mention('deposit'))
          .replace('{slots}', mention('slots'))
          .replace('{shop}', mention('shop'))}`,
    );

  return new ui.Card('help')
    .header(
      ui.featureTitle(t, 'help'),
      t('help.subtitle'),
      client.user?.displayAvatarURL({ size: 128 }),
    )
    .text(t('help.home.intro'))
    .divider()
    .text(`### ${emojis.crest} ${t('help.home.quickStart')}\n${steps.join('\n')}`)
    .divider()
    .text(
      visibleSections(admin)
        .map(
          ([id, section]) =>
            `${emojis[section.icon]} **${t(`help.sections.${id}.label`)}** — ${t(`help.sections.${id}.description`)}`,
        )
        .join('\n'),
    )
    .text(`-# ${emojis.coin} ${t('help.home.amounts')}\n-# ${t('help.tip')}`)
    .actions([sectionMenu(view)])
    .footer();
}

function renderSection(view: View, sectionId: string): ui.Card {
  const { t, lang, guildId, client, admin } = view;
  const section = SECTIONS[sectionId]!;
  const card = new ui.Card(section.color)
    .header(
      `${emojis[section.icon]} ${t(`help.sections.${sectionId}.label`)}`,
      t(`help.sections.${sectionId}.description`),
    )
    .text(
      t(`help.sections.${sectionId}.intro`, { min: coins(MIN_BET), command: mention('config') }),
    )
    .divider();

  let commands: LoadedCommand[] = [];
  if (sectionId === 'config') {
    for (const [id, category] of Object.entries(SETTING_CATEGORIES)) {
      card.text(
        `### ${t(`config.categories.${id}.label`)}\n${settingLines(guildId, id, category.fields as SettingField[], t)}`,
      );
    }
  } else {
    commands = commandsOf(client, section.category, admin);
    const lines = commands.flatMap((command) => {
      const subcommands = subcommandsOf(command.json.options);
      if (!subcommands.length) {
        return `${icon(command.data.name)} ${mention(command.data.name)} — ${describe(command.json, lang)}`;
      }
      return subcommands.map(
        (sub) =>
          `${icon(command.data.name)} ${mention(`${command.data.name} ${sub.name}`)} — ${describe(sub, lang)}`,
      );
    });
    card.text(`### ${t('help.commandsTitle')}\n${lines.join('\n')}`);

    if (sectionId === 'games') {
      const payouts = Object.entries(GAME_FEATURES).map(
        ([name, feature]) =>
          `${icon(name)} **${t(`features.${feature}`)}** · ${payoutLine(t, name)}`,
      );
      card
        .divider()
        .text(`### ${emojis.money} ${t('help.sections.games.payouts')}\n${payouts.join('\n')}`);
    }
  }

  return card
    .actions(
      [sectionMenu(view, sectionId)],
      [commandMenu(view, commands)].filter((menu) => menu !== null),
    )
    .footer(t('help.tip'));
}

function optionLines(view: View, options: APIApplicationCommandOption[] | undefined): string[] {
  return (options ?? []).map((option) => {
    const optional =
      'required' in option && option.required ? '' : ` · *${view.t('help.optional')}*`;
    return `› \`${localName(option, view.lang)}\` — ${describe(option, view.lang)}${optional}`;
  });
}

function renderCommand(view: View, command: LoadedCommand): ui.Card {
  const { t, lang, guildId, client, admin } = view;
  const { name } = command.data;
  const sectionId = Object.entries(SECTIONS).find(
    ([, section]) => section.category === command.category,
  )?.[0];

  const card = new ui.Card(sectionId ? SECTIONS[sectionId]!.color : 'help')
    .header(`${icon(name)} /${localName(command.json, lang)}`, describe(command.json, lang))
    .text(t(`help.commands.${name}.about`));

  const subcommands = subcommandsOf(command.json.options);
  const usage = subcommands.length
    ? subcommands.map((sub) =>
        [
          `${mention(`${name} ${sub.name}`)} — ${describe(sub, lang)}`,
          ...optionLines(view, sub.options),
        ].join('\n'),
      )
    : [[mention(name), ...optionLines(view, command.json.options)].join('\n')];
  card.divider().text(`### ${t('help.usage')}\n${usage.join('\n\n')}`);

  const payouts = payoutLine(t, name);
  const facts = [
    command.adminOnly && `${emojis.role} **${t('help.adminOnly')}**`,
    command.cooldown &&
      `${emojis.cooldown} **${t('help.cooldown')}** · ${formatDuration(Number(settings.get(guildId, command.cooldown)))}`,
    payouts && `${emojis.money} ${payouts}`,
    COMMAND_SETTINGS[name] &&
      `${emojis.config} ${t('help.configuredIn', { command: mention('config') })} → ${t(`config.categories.${COMMAND_SETTINGS[name]}.label`)}`,
  ].filter(Boolean);
  if (facts.length) card.divider().text(facts.join('\n'));

  const siblings = sectionId ? commandsOf(client, command.category, admin) : [];
  return card
    .actions(
      [sectionMenu(view, sectionId)],
      [commandMenu(view, siblings, name)].filter((menu) => menu !== null),
    )
    .footer(t('help.tip'));
}

function viewFor(
  interaction: { client: Client; memberPermissions: Readonly<PermissionsBitField> },
  ctx: Context,
): View {
  return { ...ctx, client: interaction.client, admin: isAdmin(interaction.memberPermissions) };
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Learn how the bot works: every command, game and setting.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Open the help page of one command directly')
        .setAutocomplete(true),
    ),

  async autocomplete(interaction, { lang }) {
    const query = interaction.options.getFocused().toLowerCase().replace(/^\//, '');
    const admin = isAdmin(interaction.memberPermissions);
    return interaction.respond(
      [...interaction.client.commands.values()]
        .filter(
          (command) =>
            (admin || !command.adminOnly) &&
            (command.data.name.includes(query) || localName(command.json, lang).includes(query)),
        )
        .sort((a, b) => localName(a.json, lang).localeCompare(localName(b.json, lang)))
        .slice(0, 25)
        .map((command) => ({
          name: `/${localName(command.json, lang)} — ${describe(command.json, lang)}`.slice(0, 100),
          value: command.data.name,
        })),
    );
  },

  async execute(interaction, ctx) {
    const view = viewFor(interaction, ctx);
    const requested = interaction.options.getString('command')?.replace(/^\//, '').toLowerCase();

    if (requested) {
      const command =
        interaction.client.commands.get(requested) ??
        [...interaction.client.commands.values()].find(
          (candidate) => localName(candidate.json, ctx.lang) === requested,
        );
      if (!command || (command.adminOnly && !view.admin)) {
        return interaction.reply(ui.error(ctx.t('help.unknownCommand', { name: requested })));
      }
      return interaction.reply(renderCommand(view, command).toMessage({ ephemeral: true }));
    }
    return interaction.reply(renderHome(view).toMessage({ ephemeral: true }));
  },

  components: {
    async section(interaction, _args, ctx) {
      if (!interaction.isStringSelectMenu()) return;
      const view = viewFor(interaction, ctx);
      const sectionId = selectedValue(interaction) ?? '';
      const section = SECTIONS[sectionId];
      if (!section || (section.adminOnly && !view.admin))
        return interaction.update(renderHome(view).toEdit());
      return interaction.update(renderSection(view, sectionId).toEdit());
    },

    async command(interaction, _args, ctx) {
      if (!interaction.isStringSelectMenu()) return;
      const view = viewFor(interaction, ctx);
      const command = interaction.client.commands.get(selectedValue(interaction) ?? '');
      if (!command || (command.adminOnly && !view.admin))
        return interaction.update(renderHome(view).toEdit());
      return interaction.update(renderCommand(view, command).toEdit());
    },
  },
});
