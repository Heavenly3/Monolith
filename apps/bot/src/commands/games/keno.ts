import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { KENO, rules } from '@spacebet/core';
import type { Translator } from '@spacebet/i18n';
import { defineCommand } from '../../framework/types.ts';
import { betError, outcomeColor, placeBet, resultText, settle } from '../../services/games.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

function paytableLine(t: Translator, spots: number): string {
  return Object.entries(KENO.paytable[spots] ?? {})
    .map(([hits, multiplier]) => `${t('keno.hits', { n: Number(hits) })} ×${multiplier}`)
    .join(' · ');
}

const ERROR_VARS = {
  badRange: { max: KENO.poolSize },
  badCount: { max: KENO.maxSpots },
  repeated: {},
};

export default defineCommand({
  cooldown: 'keno.cooldown',

  data: new SlashCommandBuilder()
    .setName('keno')
    .setDescription(`Pick up to ${KENO.maxSpots} numbers and hope they are drawn.`)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('Your bet — e.g. 500, 2.5k, half or all')
        .setRequired(true)
        .setMaxLength(20),
    )
    .addStringOption((option) =>
      option
        .setName('numbers')
        .setDescription(
          `Up to ${KENO.maxSpots} numbers from 1-${KENO.poolSize}, e.g. "4 8 15 16 23 42"`,
        )
        .setMaxLength(60),
    )
    .addIntegerOption((option) =>
      option
        .setName('quickpick')
        .setDescription('Let the bot pick this many numbers for you')
        .setMinValue(1)
        .setMaxValue(KENO.maxSpots),
    ),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const input = interaction.options.getString('numbers');

    let picks: number[];
    if (input) {
      const parsed = rules.parseKenoNumbers(input);
      if (!parsed.ok)
        return interaction.reply(ui.error(t(`keno.${parsed.error}`, ERROR_VARS[parsed.error])));
      picks = parsed.numbers;
    } else {
      picks = rules.quickPick(interaction.options.getInteger('quickpick') ?? 5);
    }

    const bet = placeBet(guildId, user, interaction.options.getString('bet', true), 'keno');
    if (!bet.ok) return interaction.reply(betError(t, 'keno', bet));

    const game = rules.playKeno(picks);
    const result = settle(guildId, user.id, bet.amount, game.multiplier);
    const drawn = new Set(game.drawn);

    const card = new ui.Card(outcomeColor(result.net))
      .header(
        ui.featureTitle(t, 'keno'),
        t('keno.summary', { hits: game.hits.length, picks: picks.length }),
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .fields([
        {
          name: t('keno.yours'),
          value: picks
            .map((n) => (drawn.has(n) ? `**${n}** ${emojis.success}` : `${n}`))
            .join(' · '),
        },
        {
          name: t('keno.drawn', { count: KENO.drawSize }),
          value: game.drawn.map((n) => (picks.includes(n) ? `**[${n}]**` : `${n}`)).join(' '),
        },
      ])
      .divider()
      .text(resultText(t, result))
      .footer(t('keno.paytable', { spots: picks.length, table: paytableLine(t, picks.length) }));

    return interaction.reply(card.toMessage());
  },
});
