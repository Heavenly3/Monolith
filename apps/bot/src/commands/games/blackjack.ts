import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import {
  blackjack,
  type BlackjackCard,
  type BlackjackHand,
  type BlackjackResult,
} from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { defineCommand, type ComponentInteraction, type Context } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import { betError, outcomeColor, resultText } from '../../services/games.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

const cardText = (card: BlackjackCard): string =>
  `\`${card.slice(0, -1)}${SUIT_SYMBOLS[card.slice(-1)]}\``;

function handLine(label: string, cards: BlackjackCard[], hideSecond = false): string {
  const shown = cards.map((card, i) => (hideSecond && i === 1 ? '`??`' : cardText(card)));
  const value = hideSecond ? blackjack.total(cards.slice(0, 1)) : blackjack.total(cards);
  return `**${label}** · ${shown.join(' ')}  →  **${hideSecond ? `${value} + ?` : value}**`;
}

function table(t: Translator, player: BlackjackCard[], dealer: BlackjackCard[], hide: boolean) {
  return [handLine(t('blackjack.dealer'), dealer, hide), handLine(t('blackjack.you'), player)].join(
    '\n',
  );
}

function playingCard(t: Translator, hand: BlackjackHand, avatar: string): ui.Card {
  const button = (move: string, label: string, style: ButtonStyle, disabled = false) =>
    new ButtonBuilder()
      .setCustomId(`blackjack:${move}:${hand.userId}`)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled);
  return new ui.Card('slots')
    .header(ui.featureTitle(t, 'blackjack'), t('blackjack.yourMove'), avatar)
    .divider()
    .text(table(t, hand.player, hand.dealer, true))
    .text(`-# ${emojis.bet} ${t('games.bet')} · ${coins(hand.stake)}`)
    .actions([
      button('hit', t('blackjack.hit'), ButtonStyle.Primary),
      button('stand', t('blackjack.stand'), ButtonStyle.Secondary),
      button(
        'double',
        t('blackjack.double', { amount: coins(hand.stake) }),
        ButtonStyle.Success,
        !hand.canDouble,
      ),
    ])
    .footer(t('blackjack.rules'));
}

function finishedCard(t: Translator, hand: BlackjackResult, avatar: string) {
  return new ui.Card(outcomeColor(hand.settlement.net))
    .header(
      ui.featureTitle(t, 'blackjack'),
      `**${t(`blackjack.outcomes.${hand.outcome}`)}**`,
      avatar,
    )
    .divider()
    .text(table(t, hand.player, hand.dealer, false))
    .divider()
    .text(resultText(t, hand.settlement))
    .footer(t('blackjack.rules'));
}

export default defineCommand({
  cooldown: 'blackjack.cooldown',

  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play blackjack against the house: get closer to 21 than the dealer.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('Your wager — e.g. 500, 2.5k, half or all')
        .setRequired(true)
        .setMaxLength(20),
    ),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const avatar = user.displayAvatarURL({ size: 128 });
    const result = blackjack.start(guildId, user, interaction.options.getString('bet', true));
    if (!result.ok) {
      if (result.reason === 'playing') {
        return interaction.reply(
          ui.info(t('blackjack.playing', { command: mention('blackjack') })),
        );
      }
      return interaction.reply(betError(t, 'blackjack', result));
    }
    if (result.state === 'done') {
      return interaction.reply(finishedCard(t, result.hand, avatar).toMessage());
    }
    return interaction.reply(playingCard(t, result.hand, avatar).toMessage());
  },

  components: {
    hit: (interaction, args, ctx) => move(interaction, args, ctx, 'hit'),
    stand: (interaction, args, ctx) => move(interaction, args, ctx, 'stand'),
    double: (interaction, args, ctx) => move(interaction, args, ctx, 'double'),
  },
});

async function move(
  interaction: ComponentInteraction,
  [ownerId = '']: string[],
  { t, guildId }: Context,
  action: 'hit' | 'stand' | 'double',
) {
  if (interaction.user.id !== ownerId) {
    return interaction.reply(ui.info(t('common.notYours', { command: mention('blackjack') })));
  }
  if (!interaction.isButton()) return;
  const avatar = interaction.user.displayAvatarURL({ size: 128 });
  const result = blackjack.play(guildId, ownerId, action);
  if (!result.ok) {
    if (result.reason === 'funds') {
      return interaction.reply(ui.error(t('blackjack.noFundsToDouble')));
    }
    return interaction.update(
      new ui.Card('warning').text(`${emojis.info} ${t('blackjack.gone')}`).toEdit(),
    );
  }
  if (result.state === 'done') {
    return interaction.update(finishedCard(t, result.hand, avatar).toEdit());
  }
  return interaction.update(playingCard(t, result.hand, avatar).toEdit());
}
