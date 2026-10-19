import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { SLOTS, rules, type SlotOutcome, type SlotSymbol } from '@mythcore/core';
import { defineCommand } from '../../framework/types.ts';
import { wait } from '../../framework/respond.ts';
import { betError, outcomeColor, placeBet, resultText, settle } from '../../services/games.ts';
import * as ui from '../../ui/index.ts';
import { emojis, reelEmojis, type EmojiName } from '../../ui/index.ts';

const OUTCOME_ICONS: Record<SlotOutcome, EmojiName> = {
  jackpot: 'jackpot',
  triple: 'win',
  pair: 'sparkle',
  none: 'lose',
};

function machine(reels: SlotSymbol[], revealed: number): string {
  const shown = reels.map((symbol, i) => (i < revealed ? reelEmojis[symbol] : emojis.spinning));
  return `# ${shown.join('  ')}`;
}

export default defineCommand({
  cooldown: 'slots.cooldown',

  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine: spin three reels.')
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
    const bet = placeBet(guildId, user, interaction.options.getString('bet', true), 'slots');
    if (!bet.ok) return interaction.reply(betError(t, 'slots', bet));

    const { reels, outcome, multiplier } = rules.spinSlots();
    const result = settle(guildId, user.id, bet.amount, multiplier);

    const frame = (revealed: number) =>
      new ui.Card('slots')
        .header(ui.featureTitle(t, 'slots'), t('slots.spinning'))
        .divider()
        .text(machine(reels, revealed));

    await interaction.reply(frame(0).toMessage());
    for (let revealed = 1; revealed < reels.length; revealed++) {
      await wait(800);
      await interaction.editReply(frame(revealed).toEdit());
    }
    await wait(800);

    const card = new ui.Card(outcomeColor(result.net))
      .header(
        ui.featureTitle(t, 'slots'),
        `${emojis[OUTCOME_ICONS[outcome]]} **${t(`slots.${outcome}`)}**`,
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(machine(reels, reels.length))
      .divider()
      .text(resultText(t, result))
      .footer(t('slots.paytable', SLOTS.payouts));

    return interaction.editReply(card.toEdit());
  },
});
