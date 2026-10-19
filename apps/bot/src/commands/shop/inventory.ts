import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { shop } from '@spacebet/core';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('See the items you (or another member) own.')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Member to inspect')),

  async execute(interaction, { t, guildId }) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const items = shop.getInventory(guildId, target.id);
    const worth = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const lines = items.map((item) => {
      const tags = [
        item.consumable && emojis.consumable,
        item.roleId && `<@&${item.roleId}>`,
      ].filter(Boolean);
      return `**${item.quantity}×** ${item.name}${tags.length ? ` · ${tags.join(' · ')}` : ''}`;
    });

    const card = new ui.Card('inventory')
      .header(
        ui.featureTitle(t, 'inventory'),
        t('inventory.subtitle', { user: target }),
        target.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(
        lines.length
          ? lines.join('\n')
          : `${emojis.shop} ${t('inventory.empty', { command: mention('shop') })}`,
      )
      .footer(items.length ? t('inventory.value', { amount: coins(worth) }) : null);

    return interaction.reply(card.toMessage());
  },
});
