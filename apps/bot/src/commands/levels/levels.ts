import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { formatNumber, levels } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

const PAGE_SIZE = 10;
const medals = (): string[] => [emojis.first, emojis.second, emojis.third];

function render(t: Translator, guildId: string, userId: string, page: number): ui.Card {
  const pages = Math.max(1, Math.ceil(levels.leaderboardSize(guildId) / PAGE_SIZE));
  const current = Math.min(Math.max(0, page), pages - 1);
  const rows = levels.leaderboard(guildId, PAGE_SIZE, current * PAGE_SIZE);

  const lines = rows.map((row, index) => {
    const position = current * PAGE_SIZE + index + 1;
    const badge = medals()[position - 1] ?? `\`#${position}\``;
    const you = row.userId === userId ? ` ◂ **${t('leaderboard.you')}**` : '';
    const stats = t('levels.boardLine', { level: row.level, xp: formatNumber(row.xp) });
    return `${badge} <@${row.userId}> · ${stats}${you}`;
  });

  const card = new ui.Card('levels')
    .header(ui.featureTitle(t, 'levels'), t('levels.boardSubtitle'))
    .divider()
    .text(lines.length ? lines.join('\n') : `${emojis.level} ${t('levels.boardEmpty')}`);

  if (pages > 1) {
    card.actions([
      new ButtonBuilder()
        .setCustomId(`levels:page:${userId}:${current - 1}`)
        .setEmoji(emojis.previous)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current === 0),
      new ButtonBuilder()
        .setCustomId('levels:noop')
        .setLabel(`${current + 1} / ${pages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`levels:page:${userId}:${current + 1}`)
        .setEmoji(emojis.next)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current >= pages - 1),
    ]);
  }

  const rank = levels.rankOf(guildId, userId);
  return card.footer(rank ? t('leaderboard.yourRank', { rank }) : null);
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('See the most experienced members of the server.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    return interaction.reply(render(t, guildId, interaction.user.id, 0).toMessage());
  },

  components: {
    async page(interaction, [ownerId = '', page = '0'], { t, guildId }) {
      if (interaction.user.id !== ownerId) {
        return interaction.reply(ui.info(t('common.notYours', { command: mention('levels') })));
      }
      if (!interaction.isButton()) return;
      return interaction.update(render(t, guildId, ownerId, Number(page)).toEdit());
    },
  },
});
