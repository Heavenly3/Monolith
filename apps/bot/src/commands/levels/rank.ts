import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { formatDuration, formatNumber, levels } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { emojis, progressBar } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("See your level and experience, or another member's.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Member to check')),

  async execute(interaction, { t, guildId }) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    if (target.bot) return interaction.reply(ui.info(`${emojis.bot} ${t('common.botsNoAccount')}`));

    const progress = levels.progressOf(guildId, target.id);
    if (progress.xp === 0) {
      return interaction.reply(ui.info(`${emojis.level} ${t('levels.noXp', { user: target })}`));
    }

    const rank = levels.rankOf(guildId, target.id);
    const next = levels.rewards(guildId).find((reward) => reward.level > progress.level);
    const maxed = progress.needed === 0;
    const percent = Math.floor(progress.ratio * 100);

    const card = new ui.Card('levels')
      .header(
        ui.featureTitle(t, 'levels'),
        t('levels.rankSubtitle', { user: target }),
        target.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(
        [
          `## ${emojis.level} ${t('levels.level')} ${progress.level}`,
          maxed
            ? `${progressBar(1)} **${t('levels.maxLevel')}**`
            : `${progressBar(progress.ratio)} **${percent}%**`,
          !maxed &&
            `-# ${t('levels.progress', {
              current: formatNumber(progress.current),
              needed: formatNumber(progress.needed),
              next: progress.level + 1,
            })}`,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .divider()
      .fields([
        { name: `${emojis.rank} ${t('levels.rank')}`, value: rank ? `**#${rank}**` : '—' },
        { name: `${emojis.xp} ${t('levels.xp')}`, value: `**${formatNumber(progress.xp)}**` },
        {
          name: `${emojis.message} ${t('levels.messages')}`,
          value: `**${formatNumber(progress.messages)}**`,
        },
        progress.voiceMinutes > 0 && {
          name: `${emojis.voice} ${t('levels.voice')}`,
          value: `**${formatDuration(progress.voiceMinutes * 60)}**`,
        },
      ]);

    return interaction.reply(
      card
        .footer(
          next ? t('levels.nextReward', { role: `<@&${next.roleId}>`, level: next.level }) : null,
        )
        .toMessage(),
    );
  },
});
