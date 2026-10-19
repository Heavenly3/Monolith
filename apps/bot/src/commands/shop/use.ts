import { InteractionContextType, SlashCommandBuilder, type Role } from 'discord.js';
import { shop } from '@spacebet/core';
import { defineCommand } from '../../framework/types.ts';
import { grantRole } from '../../services/purchases.ts';
import * as ui from '../../ui/index.ts';
import { emojis } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('use')
    .setDescription('Use a consumable item from your inventory.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('item')
        .setDescription('The item to use')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('quantity')
        .setDescription('How many (default 1)')
        .setMinValue(1)
        .setMaxValue(1000),
    ),

  async autocomplete(interaction, { guildId }) {
    const query = interaction.options.getFocused().toLowerCase();
    return interaction.respond(
      shop
        .getInventory(guildId, interaction.user.id)
        .filter((item) => item.consumable && item.name.toLowerCase().includes(query))
        .slice(0, 25)
        .map((item) => ({
          name: `${item.name} (×${item.quantity})`.slice(0, 100),
          value: String(item.id),
        })),
    );
  },

  async execute(interaction, { t, guildId }) {
    const { user, member } = interaction;
    const product = shop.resolveProduct(guildId, interaction.options.getString('item', true));
    const quantity = interaction.options.getInteger('quantity') ?? 1;

    if (!product) return interaction.reply(ui.error(t('use.notFound')));
    if (!product.consumable)
      return interaction.reply(ui.error(t('use.permanent', { item: product.name })));
    if (product.roleId && quantity > 1) return interaction.reply(ui.error(t('use.roleOne')));

    const owned = shop.getQuantity(guildId, user.id, product.id);
    if (owned < quantity) {
      return interaction.reply(
        ui.error(t('use.notEnough', { quantity: owned, item: product.name })),
      );
    }

    let role: Role | null = null;
    if (product.roleId) {
      const granted = await grantRole(member, product.roleId, t);
      if (!granted.ok) return interaction.reply(ui.error(granted.reason));
      if (granted.alreadyHad)
        return interaction.reply(ui.info(t('use.alreadyHad', { role: granted.role })));
      role = granted.role;
    }

    shop.removeItem(guildId, user.id, product.id, quantity);

    const card = new ui.Card('inventory')
      .header(
        `${emojis.sparkle} ${t('use.title')}`,
        t('use.body', { quantity, item: product.name }),
      )
      .divider()
      .stats([
        product.description && { name: emojis.description, value: product.description },
        role && { name: `${emojis.role} ${t('shop.roleReceived')}`, value: `${role}` },
        { name: `${emojis.inventory} ${t('use.remaining')}`, value: String(owned - quantity) },
      ])
      .footer(t('features.inventory'));

    return interaction.reply(card.toMessage());
  },
});
