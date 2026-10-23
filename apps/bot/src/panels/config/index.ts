// Mission Control: the /config admin panel. Every section lives in
// ./sections/<id>.ts and implements the Section contract (see ./types.ts).
import { ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { audit, isSettingCategory, settingsForm } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { translatorFor } from '../../framework/context.ts';
import type { ComponentInteraction } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';
import { actionId, saveValues, valuesModal } from './shared.ts';
import type {
  ActionContext,
  ActionResult,
  Confirmation,
  PanelAction,
  PanelState,
  Section,
} from './types.ts';
import { general } from './sections/general.ts';
import { members } from './sections/members.ts';
import { workSection } from './sections/work.ts';
import { collect } from './sections/collect.ts';
import { wheelSection } from './sections/wheel.ts';
import { games } from './sections/games.ts';
import { shopSection } from './sections/shop.ts';
import { loansSection } from './sections/loans.ts';
import { raffleSection } from './sections/raffle.ts';
import { modulesSection } from './sections/modules.ts';
import { levelsSection } from './sections/levels.ts';

const SECTIONS: Record<string, Section> = {
  general,
  modules: modulesSection,
  members,
  work: workSection,
  collect,
  wheel: wheelSection,
  games,
  shop: shopSection,
  loans: loansSection,
  raffle: raffleSection,
  levels: levelsSection,
};

// Actions every section with settings gets for free.
// The category is the section itself, or the first argument when a section
// shows several categories (e.g. levels).
const categoryOf = ({ sectionId, args }: ActionContext): string =>
  args[0] && isSettingCategory(args[0]) ? args[0] : sectionId;

const GENERIC: Record<string, PanelAction> = {
  edit(context) {
    const { guildId, t, sectionId } = context;
    const category = categoryOf(context);
    return isSettingCategory(category)
      ? { modal: valuesModal(guildId, category, t, sectionId) }
      : { error: t('config.unknown') };
  },
  save(context) {
    const { guildId, t, fields } = context;
    const category = categoryOf(context);
    if (!fields || !isSettingCategory(category)) return { error: t('config.unknown') };
    const problem = saveValues(guildId, category, fields, t);
    return problem ? { error: problem } : { banner: `${emojis.success} ${t('config.saved')}` };
  },
  reset(context) {
    const { guildId, t } = context;
    const category = categoryOf(context);
    if (!isSettingCategory(category)) return { error: t('config.unknown') };
    settingsForm.resetCategory(guildId, category);
    return { banner: `${emojis.reset} ${t('config.restored')}` };
  },
  cancel: ({ t }) => ({ banner: `${emojis.info} ${t('panel.cancelled')}` }),
};

// Actions that only open a form or ask a question are not worth auditing.
const NOT_AUDITED = new Set(['edit', 'add', 'adjust', 'cancel']);

const label = (t: Translator, id: string): string => t(`config.categories.${id}.label`);
const description = (t: Translator, id: string): string => t(`config.categories.${id}.description`);

function sectionMenu(t: Translator, selected?: string): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('config:view')
    .setPlaceholder(t('config.placeholder'))
    .addOptions(
      Object.entries(SECTIONS).map(([value, section]) => ({
        label: label(t, value),
        description: description(t, value),
        emoji: emojis[section.icon],
        value,
        default: value === selected,
      })),
    );
}

function confirmRow(
  t: Translator,
  sectionId: string,
  { action, args = [] }: Confirmation,
): ButtonBuilder[] {
  return [
    new ButtonBuilder()
      .setCustomId(actionId(sectionId, action, ...args, 'yes'))
      .setLabel(t('panel.confirm'))
      .setEmoji(emojis.success)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(actionId(sectionId, 'cancel'))
      .setLabel(t('panel.cancel'))
      .setStyle(ButtonStyle.Secondary),
  ];
}

export interface RenderOptions {
  banner?: string | ((t: Translator) => string);
  confirm?: Confirmation;
}

/** Builds the panel. `sectionId` null shows the overview. */
export function render(
  t: Translator,
  state: PanelState,
  sectionId: string | null,
  { banner, confirm }: RenderOptions = {},
): ui.Card {
  const section = sectionId ? SECTIONS[sectionId] : undefined;
  const card = new ui.Card(section?.color ?? 'config').header(
    ui.featureTitle(t, 'config'),
    t('config.subtitle'),
  );
  if (banner) card.text(typeof banner === 'function' ? banner(t) : banner);
  card.divider();

  if (!section || !sectionId) {
    card.text(
      Object.entries(SECTIONS)
        .map(([id, s]) => `${emojis[s.icon]} **${label(t, id)}** — ${description(t, id)}`)
        .join('\n'),
    );
    return card.actions([sectionMenu(t)]).footer();
  }

  const { blocks, rows } = section.render(t, state);
  card.text(`### ${emojis[section.icon]} ${label(t, sectionId)}`);
  for (const block of blocks) if (block) card.text(block);

  // While confirming, only the confirmation buttons are offered.
  const actionRows = confirm
    ? [confirmRow(t, sectionId, confirm)]
    : [[sectionMenu(t, sectionId)], ...rows.map((row) => row.filter((c) => c !== null))];
  return card
    .divider()
    .actions(...actionRows)
    .footer();
}

/** Runs a panel action: `config:act:<section>:<action>:<args...>`. */
export async function handle(
  interaction: ComponentInteraction,
  [sectionId = '', action = '', ...args]: string[],
  t: Translator,
): Promise<unknown> {
  const section = SECTIONS[sectionId];
  const handler = section?.actions?.[action] ?? GENERIC[action];
  if (!section || !handler) return interaction.reply(ui.error(t('config.unknown')));

  const context: ActionContext = {
    interaction,
    sectionId,
    args,
    t,
    guildId: interaction.guildId,
    value: interaction.isAnySelectMenu() ? interaction.values[0] : undefined,
    fields: interaction.isModalSubmit() ? interaction.fields : undefined,
  };
  const result: ActionResult = await handler(context);

  if ('modal' in result) {
    if (interaction.isModalSubmit()) return interaction.reply(ui.error(t('config.unknown')));
    return interaction.showModal(result.modal);
  }
  if ('error' in result) return interaction.reply(ui.error(result.error));

  if (!result.confirm && !NOT_AUDITED.has(action)) {
    audit.record(interaction.guildId, interaction.user.id, `config.${sectionId}.${action}`, {
      args: args.filter((arg) => arg !== 'yes'),
      value: context.value ?? null,
    });
  }

  const lang = result.refresh ? translatorFor(interaction.guildId, interaction.locale) : t;
  const card = render(lang, { guildId: interaction.guildId, guild: interaction.guild }, sectionId, {
    banner: result.banner,
    confirm: result.confirm,
  });
  // Forms opened from the panel update it in place.
  if (interaction.isModalSubmit() && !interaction.isFromMessage()) {
    return interaction.reply(card.toMessage({ ephemeral: true }));
  }
  return interaction.update(card.toEdit());
}
