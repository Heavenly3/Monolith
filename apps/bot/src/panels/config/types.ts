import type {
  Guild,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitFields,
} from 'discord.js';
import type { Translator } from '@spacebet/i18n';
import type { ComponentInteraction } from '../../framework/types.ts';
import type { ColorName, EmojiName } from '../../ui/index.ts';

export interface PanelState {
  guildId: string;
  guild: Guild;
}

export interface Confirmation {
  action: string;
  args?: string[];
}

/** What happens after an action. */
export type ActionResult =
  /** Re-render the panel with a message on top (optionally asking for confirmation). */
  | { banner: string | ((t: Translator) => string); confirm?: Confirmation; refresh?: boolean }
  /** Open a form. */
  | { modal: ModalBuilder }
  /** Reply with a private error. */
  | { error: string };

export interface ActionContext {
  interaction: ComponentInteraction;
  sectionId: string;
  args: string[];
  t: Translator;
  guildId: string;
  /** Value picked in a select menu, if any. */
  value: string | undefined;
  /** Fields of a submitted form, if any. */
  fields: ModalSubmitFields | undefined;
}

export type PanelAction = (ctx: ActionContext) => ActionResult | Promise<ActionResult>;

export interface SectionView {
  blocks: (string | null | false)[];
  rows: (MessageActionRowComponentBuilder | null)[][];
}

export interface Section {
  icon: EmojiName;
  color: ColorName;
  render(t: Translator, state: PanelState): SectionView;
  actions?: Record<string, PanelAction>;
}

/** Destructive actions run only when the last argument is "yes". */
export const confirmed = (args: string[]): boolean => args.at(-1) === 'yes';
