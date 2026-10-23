import { LabelBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder } from 'discord.js';
import { formatNumber, parseWholeNumber, shop, type Product } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { coins, emojis } from '../../../ui/index.ts';
import { ButtonStyle, button, list, modal, picker, textField } from '../shared.ts';
import { confirmed, type Section } from '../types.ts';

function itemLine(t: Translator, item: Product): string {
  const type = item.consumable
    ? `${emojis.consumable} ${t('shop.consumable')}`
    : `${emojis.permanent} ${t('shop.permanent')}`;
  return `**${item.name}** · ${coins(item.price)} · ${type}${item.roleId ? ` · <@&${item.roleId}>` : ''}`;
}

function itemModal(t: Translator) {
  return modal('shop', 'saveItem', t('panel.shop.modalTitle')).addLabelComponents(
    textField('name', t('panel.shop.name'), { max: 50 }),
    textField('price', t('shopAdmin.price'), { description: t('config.hints.coins'), max: 12 }),
    textField('description', t('shopAdmin.description'), {
      required: false,
      paragraph: true,
      max: 200,
    }),
    new LabelBuilder()
      .setLabel(t('shopAdmin.type'))
      .setDescription(t('panel.shop.typeHint'))
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder()
          .setCustomId('type')
          .setRequired(true)
          .addOptions(
            {
              label: t('shop.permanent'),
              emoji: emojis.permanent,
              value: 'permanent',
              default: true,
            },
            { label: t('shop.consumable'), emoji: emojis.consumable, value: 'consumable' },
          ),
      ),
    new LabelBuilder()
      .setLabel(t('panel.shop.role'))
      .setDescription(t('panel.shop.roleHint'))
      .setRoleSelectMenuComponent(
        new RoleSelectMenuBuilder().setCustomId('role').setRequired(false),
      ),
  );
}

export const shopSection: Section = {
  icon: 'shop',
  color: 'shop',

  render(t, { guildId }) {
    const products = shop.listProducts(guildId);
    return {
      blocks: [
        `### ${emojis.buy} ${t('panel.shop.items')} (${products.length})\n${
          products.length
            ? list(
                products.map((item) => itemLine(t, item)),
                t,
                10,
              )
            : t('shop.empty')
        }`,
        `-# ${t('panel.shop.hint')}`,
      ],
      rows: [
        [button('shop', 'add', t('panel.shop.add'), emojis.buy, ButtonStyle.Success)],
        [
          picker(
            'shop',
            'remove',
            t('panel.shop.removePlaceholder'),
            products.map((item) => ({
              label: item.name,
              description: formatNumber(item.price),
              emoji: item.consumable ? emojis.consumable : emojis.permanent,
              value: String(item.id),
            })),
          ),
        ],
      ],
    };
  },

  actions: {
    add: ({ t }) => ({ modal: itemModal(t) }),

    saveItem({ t, guildId, fields, interaction }) {
      if (!fields) return { error: t('config.unknown') };
      const name = fields.getTextInputValue('name').trim();
      const price = parseWholeNumber(fields.getTextInputValue('price'));
      const role = fields.getSelectedRoles('role')?.first() ?? null;

      if (!name) return { error: t('panel.shop.nameRequired') };
      if (price === null) {
        return {
          error: t('config.invalid', {
            field: t('shopAdmin.price'),
            hint: t('config.hints.coins'),
          }),
        };
      }
      if (shop.findProductByName(guildId, name))
        return { error: t('shopAdmin.exists', { item: name }) };
      if (role && (('managed' in role && role.managed) || role.id === interaction.guildId)) {
        return { error: t('shopAdmin.badRole') };
      }

      const product = shop.addProduct(guildId, {
        name,
        price,
        description: fields.getTextInputValue('description'),
        roleId: role?.id ?? null,
        consumable: fields.getStringSelectValues('type')[0] === 'consumable',
      });
      const guildRole = role ? interaction.guild.roles.cache.get(role.id) : null;
      const warning =
        guildRole && !guildRole.editable
          ? `\n-# ${emojis.warning} ${guildRole} ${t('shopAdmin.cantAssign')}`
          : '';
      return {
        banner: `${emojis.success} ${t('shopAdmin.addedBody', { item: product.name })}${warning}`,
      };
    },

    remove({ t, guildId, args, value }) {
      const id = Number(args[0] ?? value);
      const product = shop.getProduct(guildId, id);
      if (!product) return { error: t('shopAdmin.notFound') };
      if (!confirmed(args)) {
        return {
          confirm: { action: 'remove', args: [String(id)] },
          banner: `${emojis.warning} ${t('panel.shop.confirmRemove', { item: product.name })}`,
        };
      }
      shop.removeProduct(guildId, id);
      return { banner: `${emojis.success} ${t('shopAdmin.removed', { item: product.name })}` };
    },
  },
};
