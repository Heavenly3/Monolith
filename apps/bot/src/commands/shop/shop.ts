import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  SlashCommandBuilder,
} from 'discord.js';
import { accounts, shop, truncate, type Product } from '@spacebet/core';
import type { Translator } from '@spacebet/i18n';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import { buy } from '../../services/purchases.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis } from '../../ui/index.ts';

const PAGE_SIZE = 5;

function describe(t: Translator, product: Product): string {
  const tags = [
    product.consumable
      ? `${emojis.consumable} ${t('shop.consumable')}`
      : `${emojis.permanent} ${t('shop.permanent')}`,
    product.roleId && `${emojis.role} ${t('shop.grants', { role: `<@&${product.roleId}>` })}`,
  ].filter(Boolean);
  const lines = [`### ${product.name}`, `${coins(product.price)} · ${tags.join(' · ')}`];
  if (product.description) lines.push(`-# ${truncate(product.description, 200)}`);
  return lines.join('\n');
}

function render(t: Translator, guildId: string, page: number): ui.Card {
  const products = shop.listProducts(guildId);
  const pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const current = Math.min(Math.max(0, page), pages - 1);

  const card = new ui.Card('shop').header(
    ui.featureTitle(t, 'shop'),
    t('shop.subtitle', { command: mention('buy') }),
  );
  if (products.length === 0) {
    return card
      .divider()
      .text(`${emojis.star} ${t('shop.empty')}`)
      .footer();
  }

  for (const product of products.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)) {
    card
      .divider()
      .section(
        describe(t, product),
        new ButtonBuilder()
          .setCustomId(`shop:buy:${product.id}`)
          .setLabel(t('shop.buy'))
          .setEmoji(emojis.buy)
          .setStyle(ButtonStyle.Primary),
      );
  }

  if (pages > 1) {
    card.divider().actions([
      new ButtonBuilder()
        .setCustomId(`shop:page:${current - 1}`)
        .setEmoji(emojis.previous)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current === 0),
      new ButtonBuilder()
        .setCustomId('shop:noop')
        .setLabel(`${current + 1} / ${pages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`shop:page:${current + 1}`)
        .setEmoji(emojis.next)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(current >= pages - 1),
    ]);
  }

  return card.footer(t('shop.items', { count: products.length }));
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse the items for sale.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    return interaction.reply(render(t, guildId, 0).toMessage());
  },

  components: {
    async page(interaction, [page = '0'], { t, guildId }) {
      if (!interaction.isButton()) return;
      return interaction.update(render(t, guildId, Number(page)).toEdit());
    },

    async buy(interaction, [productId = ''], { t, guildId }) {
      const product = shop.getProduct(guildId, Number(productId));
      if (!product) return interaction.reply(ui.error(t('shop.gone')));

      const result = await buy(interaction.member, product, 1, t);
      if (!result.ok) return interaction.reply(ui.error(result.error));

      const wallet = accounts.findAccount(guildId, interaction.user.id)!.wallet;
      const parts = [
        t('shop.boughtQuick', { item: product.name, amount: coins(result.total) }),
        result.role && t('shop.boughtRole', { role: result.role }),
        t('shop.walletNow', { amount: coins(wallet) }),
      ];
      return interaction.reply(ui.success(parts.filter(Boolean).join(' ')));
    },
  },
});
