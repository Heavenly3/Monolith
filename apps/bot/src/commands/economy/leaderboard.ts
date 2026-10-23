import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { accounts } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

const PAGE_SIZE = 10;
const medals = (): string[] => [emojis.first, emojis.second, emojis.third];

function render(t: Translator, guildId: string, userId: string, page: number): ui.Card {
  const pages = Math.max(1, Math.ceil(accounts.leaderboardSize(guildId) / PAGE_SIZE));
  const current = Math.min(Math.max(0, page), pages - 1);
  const rows = accounts.leaderboard(guildId, PAGE_SIZE, current * PAGE_SIZE);

  const lines = rows.map((row, index) => {
    const position = current * PAGE_SIZE + index + 1;
    const badge = medals()[position - 1] ?? `\`#${position}\``;
    const you = row.userId === userId ? ` ◂ **${t('leaderboard.you')}**` : '';
    return `${badge} <@${row.userId}> · ${coins(row.netWorth)}${you}`;
  });

  const card = new ui.Card('leaderboard')
    .header(ui.featureTitle(t, 'leaderboard'), t('leaderboard.subtitle'))
    .divider()
    .text(lines.length ? lines.join('\n') : `${emojis.logo} ${t('leaderboard.empty')}`);

  if (pages > 1) {
    card.actions([
      new ButtonBuilder()
        .setCustomId(`leaderboard:page:${userId}:${current - 1}`)
        .setEmoji(emojis.previous)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current === 0),
      new ButtonBuilder()
        .setCustomId('leaderboard:noop')
        .setLabel(`${current + 1} / ${pages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`leaderboard:page:${userId}:${current + 1}`)
        .setEmoji(emojis.next)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current >= pages - 1),
    ]);
  }

  const rank = accounts.rankOf(guildId, userId);
  return card.footer(rank ? t('leaderboard.yourRank', { rank }) : null);
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See the richest members of the server.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    return interaction.reply(render(t, guildId, interaction.user.id, 0).toMessage());
  },

  components: {
    async page(interaction, [ownerId = '', page = '0'], { t, guildId }) {
      if (interaction.user.id !== ownerId) {
        return interaction.reply(
          ui.info(t('common.notYours', { command: mention('leaderboard') })),
        );
      }
      if (!interaction.isButton()) return;
      return interaction.update(render(t, guildId, ownerId, Number(page)).toEdit());
    },
  },
});
