import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, formatNumber, shop } from '@spacebet/core';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import { buy } from '../../services/purchases.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('item')
        .setDescription('The item to buy')
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
    return interaction.respond(
      shop.searchProducts(guildId, interaction.options.getFocused()).map((product) => ({
        name: `${product.name} — ${formatNumber(product.price)}`.slice(0, 100),
        value: String(product.id),
      })),
    );
  },

  async execute(interaction, { t, guildId }) {
    const product = shop.resolveProduct(guildId, interaction.options.getString('item', true));
    if (!product)
      return interaction.reply(ui.error(t('shop.notFound', { command: mention('shop') })));

    const quantity = interaction.options.getInteger('quantity') ?? 1;
    const result = await buy(interaction.member, product, quantity, t);
    if (!result.ok) return interaction.reply(ui.error(result.error));

    const card = new ui.Card('shop')
      .header(
        `${emojis.buy} ${t('shop.purchaseTitle')}`,
        t('shop.purchaseBody', { quantity, item: product.name, amount: coins(result.total) }),
      )
      .divider()
      .stats([
        result.role && {
          name: `${emojis.role} ${t('shop.roleReceived')}`,
          value: `${result.role}`,
        },
        product.consumable && {
          name: `${emojis.inventory} ${t('shop.owned')}`,
          value: formatNumber(shop.getQuantity(guildId, interaction.user.id, product.id)),
        },
        {
          name: `${emojis.wallet} ${t('common.wallet')}`,
          value: coins(accounts.findAccount(guildId, interaction.user.id)!.wallet),
        },
      ])
      .footer(
        product.consumable ? t('shop.useHint', { command: mention('use') }) : t('features.shop'),
      );

    return interaction.reply(card.toMessage());
  },
});
