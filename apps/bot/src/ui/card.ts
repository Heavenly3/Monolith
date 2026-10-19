import {
  ActionRowBuilder,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  TimestampStyles,
  time,
  type ButtonBuilder,
  type InteractionReplyOptions,
  type MessageCreateOptions,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { theme, type ColorName } from './theme.ts';

// Discord caps the text of a Components V2 message at 4000 characters.
const MAX_TEXT = 3800;

export interface CardField {
  name: string;
  value: string;
}

/** Entries can be falsy to make conditional fields easy: `cond && { name, value }`. */
type Entries = (CardField | false | null | undefined | 0 | '')[];

export type CardMessage = InteractionReplyOptions & { flags: number };

/**
 * Fluent builder for Components V2 messages. Every reply of the bot is a Card
 * so they share the same look:
 *
 *   new Card('economy').header('Title', 'subtitle', avatarUrl)
 *     .fields([{ name: 'Wallet', value: '100' }]).footer().toMessage();
 */
export class Card {
  readonly container: ContainerBuilder;
  #textLength = 0;

  constructor(color: ColorName | number = 'brand') {
    this.container = new ContainerBuilder().setAccentColor(
      typeof color === 'number' ? color : theme.colors[color],
    );
  }

  #text(content: string): TextDisplayBuilder {
    const budget = MAX_TEXT - this.#textLength;
    const safe =
      content.length > budget ? `${content.slice(0, Math.max(0, budget - 1))}…` : content;
    this.#textLength += safe.length;
    return new TextDisplayBuilder().setContent(safe || '​');
  }

  /** Title line, optional subtitle, optional thumbnail on the right. */
  header(title: string, subtitle?: string | null, thumbnailUrl?: string): this {
    const lines = [`## ${title}`];
    if (subtitle) lines.push(subtitle);
    return this.section(lines.join('\n'), thumbnailUrl);
  }

  /** Text with an optional thumbnail (URL) or button next to it. */
  section(content: string, accessory?: string | ButtonBuilder): this {
    if (!accessory) return this.text(content);
    const section = new SectionBuilder().addTextDisplayComponents(this.#text(content));
    if (typeof accessory === 'string') {
      section.setThumbnailAccessory(new ThumbnailBuilder().setURL(accessory));
    } else {
      section.setButtonAccessory(accessory);
    }
    this.container.addSectionComponents(section);
    return this;
  }

  text(content: string): this {
    this.container.addTextDisplayComponents(this.#text(content));
    return this;
  }

  divider({ large = false, visible = true } = {}): this {
    this.container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(visible)
        .setSpacing(large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small),
    );
    return this;
  }

  /** Key/value pairs rendered as stacked blocks. */
  fields(entries: Entries): this {
    const lines = entries.filter(Boolean).map((entry) => {
      const { name, value } = entry as CardField;
      return `**${name}**\n${value}`;
    });
    return lines.length ? this.text(lines.join('\n\n')) : this;
  }

  /** Compact `label · value` lines. */
  stats(entries: Entries): this {
    const lines = entries.filter(Boolean).map((entry) => {
      const { name, value } = entry as CardField;
      return `${name} · ${value}`;
    });
    return lines.length ? this.text(lines.join('\n')) : this;
  }

  /** Adds one action row per argument (each an array of components). Empty rows are skipped. */
  actions(...rows: (MessageActionRowComponentBuilder[] | null | undefined)[]): this {
    for (const components of rows) {
      if (!components?.length) continue;
      this.container.addActionRowComponents(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components),
      );
    }
    return this;
  }

  footer(note?: string | null): this {
    const stamp = time(new Date(), TimestampStyles.ShortDateTime);
    const parts = [theme.name, note, stamp].filter(Boolean);
    return this.divider().text(`-# ${parts.join(' • ')}`);
  }

  toMessage({ ephemeral = false } = {}): CardMessage {
    let flags: number = MessageFlags.IsComponentsV2;
    if (ephemeral) flags |= MessageFlags.Ephemeral;
    return { components: [this.container], flags, allowedMentions: { parse: [] } };
  }

  /**
   * Payload to edit an existing message (interaction.update / editReply).
   * Visibility (ephemeral) is fixed when the message is created, so no flag
   * other than Components V2 may be sent here.
   */
  toEdit() {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2 as const,
      allowedMentions: { parse: [] as [] },
    };
  }

  /** Payload for channel messages and DMs (not interaction replies). */
  toChannelMessage(allowedUsers: string[] = []): MessageCreateOptions {
    return {
      components: [this.container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { users: allowedUsers },
    };
  }
}
