import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { HORSERACE, rules } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { wait } from '../../framework/respond.ts';
import { betError, outcomeColor, placeBet, resultText, settle } from '../../services/games.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

const TRACK_LENGTH = 12;
const places = (): string[] => [emojis.first, emojis.second, emojis.third];
const horseName = (index: number): string => `#${index + 1} ${HORSERACE.horses[index]}`;

/** Renders the track for one animation frame (progress 0..1). */
function track(order: number[], chosen: number, progress: number): string {
  return HORSERACE.horses
    .map((_, horse) => {
      // Horses that finish higher run slightly faster.
      const speed = 1 - order.indexOf(horse) * 0.06;
      const position = Math.min(TRACK_LENGTH, Math.round(TRACK_LENGTH * progress * speed));
      const lane = `${'·'.repeat(TRACK_LENGTH - position)}${emojis.horse}${'·'.repeat(position)}`;
      const marker = horse === chosen ? ` ${emojis.marker}` : '';
      return `\`${String(horse + 1).padStart(2)}\` ${emojis.finish}${lane}${marker}`;
    })
    .join('\n');
}

export default defineCommand({
  cooldown: 'horserace.cooldown',

  data: new SlashCommandBuilder()
    .setName('race')
    .setDescription('Bet on a knight in the horse race.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('Your wager — e.g. 500, 2.5k, half or all')
        .setRequired(true)
        .setMaxLength(20),
    )
    .addIntegerOption((option) =>
      option
        .setName('knight')
        .setDescription('The knight you bet on')
        .setRequired(true)
        .addChoices(
          ...HORSERACE.horses.map((_, index) => ({ name: horseName(index), value: index })),
        ),
    ),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const chosen = interaction.options.getInteger('knight', true);
    const bet = placeBet(guildId, user, interaction.options.getString('bet', true), 'horserace');
    if (!bet.ok) return interaction.reply(betError(t, 'horserace', bet));

    const race = rules.runRace(chosen);
    const result = settle(guildId, user.id, bet.amount, race.multiplier);

    const frame = (progress: number) =>
      new ui.Card('horserace')
        .header(
          ui.featureTitle(t, 'horserace'),
          t('horserace.backed', { horse: horseName(chosen) }),
        )
        .divider()
        .text(track(race.order, chosen, progress));

    await interaction.reply(frame(0).toMessage());
    for (const progress of [0.35, 0.7]) {
      await wait(1000);
      await interaction.editReply(frame(progress).toEdit());
    }
    await wait(1000);

    const podium = race.order
      .slice(0, 3)
      .map((horse, i) => `${places()[i]} **${horseName(horse)}** · ×${HORSERACE.payouts[i + 1]}`)
      .join('\n');

    const card = new ui.Card(outcomeColor(result.net))
      .header(
        ui.featureTitle(t, 'horserace', t('horserace.results')),
        t('horserace.finished', { horse: horseName(chosen), place: race.place }),
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(podium)
      .divider()
      .text(resultText(t, result))
      .footer();

    return interaction.editReply(card.toEdit());
  },
});
