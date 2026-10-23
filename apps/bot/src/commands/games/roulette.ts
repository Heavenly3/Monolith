import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { ROULETTE_BETS, rules, type RouletteBet } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { wait } from '../../framework/respond.ts';
import { betError, placeBet, resultText, settle } from '../../services/games.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'roulette.cooldown',

  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Bet on the roulette wheel.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('Your wager — e.g. 500, 2.5k, half or all')
        .setRequired(true)
        .setMaxLength(20),
    )
    .addStringOption((option) =>
      option
        .setName('on')
        .setDescription('What you bet on')
        .setRequired(true)
        .addChoices(
          ...Object.entries(ROULETTE_BETS).map(([value, { label, multiplier }]) => ({
            name: `${label} — pays ×${multiplier}`,
            value,
          })),
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName('number')
        .setDescription('The number you bet on (only for "Single number")')
        .setMinValue(0)
        .setMaxValue(36),
    ),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const betType = interaction.options.getString('on', true) as RouletteBet;
    const pick = interaction.options.getInteger('number');

    if (betType === 'straight' && pick === null) {
      return interaction.reply(ui.error(t('roulette.needsNumber')));
    }

    const bet = placeBet(guildId, user, interaction.options.getString('bet', true), 'roulette');
    if (!bet.ok) return interaction.reply(betError(t, 'roulette', bet));

    const spin = rules.spinRoulette(betType, pick);
    const result = settle(guildId, user.id, bet.amount, spin.multiplier);
    const betLabel =
      betType === 'straight' ? t('roulette.number', { n: pick }) : t(`roulette.bets.${betType}`);

    await interaction.reply(
      new ui.Card('roulette')
        .header(
          ui.featureTitle(t, 'roulette'),
          `${emojis.spinning} ${t('roulette.spinning', { bet: betLabel })}`,
        )
        .toMessage(),
    );
    await wait(1800);

    const card = new ui.Card(spin.won ? 'success' : 'danger')
      .header(
        ui.featureTitle(t, 'roulette'),
        t('roulette.landed', {
          icon: emojis[spin.color],
          number: spin.number,
          color: t(`roulette.colors.${spin.color}`),
        }),
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(
        spin.won
          ? `${emojis.win} ${t('roulette.win', { bet: betLabel })}`
          : `${emojis.lose} ${t('roulette.lose', { bet: betLabel })}`,
      )
      .divider()
      .text(resultText(t, result))
      .footer();

    return interaction.editReply(card.toEdit());
  },
});
