import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { formatDuration, formatNumber, levels, settings, totalXpFor } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { activityOf } from '../../services/levelUp.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('calculate')
    .setDescription('See how much XP and chat a level takes.')
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((option) =>
      option
        .setName('level')
        .setDescription('Level to calculate')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000),
    )
    .addUserOption((option) => option.setName('user').setDescription('Member to calculate for')),

  async execute(interaction, { t, guildId }) {
    const level = interaction.options.getInteger('level', true);
    const target = interaction.options.getUser('user') ?? interaction.user;
    if (target.bot) return interaction.reply(ui.info(`${emojis.bot} ${t('common.botsNoAccount')}`));

    const curve = levels.curveOf(guildId);
    if (level > curve.maxLevel) {
      return interaction.reply(ui.info(t('levels.calcMax', { max: curve.maxLevel })));
    }
    const member =
      target.id === interaction.user.id
        ? interaction.member
        : interaction.options.getMember('user');
    const { xp } = levels.getMember(guildId, target.id);
    const total = totalXpFor(level, curve);
    const missing = total - xp;
    if (missing <= 0) {
      return interaction.reply(
        ui.info(`${emojis.level} ${t('levels.calcReached', { user: target, level })}`),
      );
    }

    const multiplier =
      member && interaction.channel
        ? levels.multiplierFor(guildId, activityOf(member, interaction.channel)).total
        : 100;
    const messages = levels.messagesUntil(guildId, missing, multiplier);
    const cooldown = settings.get(guildId, 'levels.cooldown');

    const card = new ui.Card('levels')
      .header(
        `${emojis.level} ${t('levels.calcTitle', { level })}`,
        t('levels.rankSubtitle', { user: target }),
        target.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .fields([
        { name: `${emojis.xp} ${t('levels.calcTotal')}`, value: `**${formatNumber(total)}**` },
        { name: `${emojis.up} ${t('levels.calcMissing')}`, value: `**${formatNumber(missing)}**` },
        messages !== null && {
          name: `${emojis.message} ${t('levels.calcMessages')}`,
          value: `≈ **${formatNumber(messages)}**`,
        },
        messages !== null && {
          name: `${emojis.clock} ${t('levels.calcTime')}`,
          value: `≈ **${formatDuration(messages * cooldown)}**`,
        },
      ]);
    return interaction.reply(card.footer(t('levels.calcFooter')).toMessage());
  },
});
