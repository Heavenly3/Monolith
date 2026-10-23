import { LabelBuilder, RoleSelectMenuBuilder } from 'discord.js';
import { formatNumber, parseWholeNumber, roleRewards } from '@monolith/core';
import { coins, emojis } from '../../../ui/index.ts';
import {
  ButtonStyle,
  button,
  categoryLines,
  editButton,
  list,
  modal,
  picker,
  textField,
} from '../shared.ts';
import { confirmed, type Section } from '../types.ts';

export const collect: Section = {
  icon: 'collect',
  color: 'collect',

  render(t, { guildId, guild }) {
    const rewards = roleRewards.list(guildId);
    return {
      blocks: [
        categoryLines(guildId, 'collect', t),
        `### ${emojis.role} ${t('panel.collect.roles')}\n${
          rewards.length
            ? list(
                rewards.map((reward) => `<@&${reward.roleId}> · ${coins(reward.amount)}`),
                t,
              )
            : t('panel.collect.empty')
        }`,
      ],
      rows: [
        [
          editButton(t, 'collect'),
          button('collect', 'add', t('panel.collect.add'), emojis.role, ButtonStyle.Success),
          button('collect', 'clear', t('panel.clearAll'), emojis.reset, ButtonStyle.Danger),
        ],
        [
          picker(
            'collect',
            'remove',
            t('panel.collect.removePlaceholder'),
            rewards.map((reward) => ({
              label: `@${guild.roles.cache.get(reward.roleId)?.name ?? reward.roleId}`,
              description: formatNumber(reward.amount),
              emoji: emojis.role,
              value: reward.roleId,
            })),
          ),
        ],
      ],
    };
  },

  actions: {
    add: ({ t }) => ({
      modal: modal('collect', 'saveRole', t('panel.collect.modalTitle')).addLabelComponents(
        new LabelBuilder()
          .setLabel(t('panel.collect.roleLabel'))
          .setRoleSelectMenuComponent(
            new RoleSelectMenuBuilder().setCustomId('role').setRequired(true),
          ),
        textField('amount', t('panel.collect.amountLabel'), {
          description: t('config.hints.coins'),
          max: 12,
        }),
      ),
    }),

    saveRole({ t, guildId, fields }) {
      const role = fields?.getSelectedRoles('role', true).first();
      const amount = parseWholeNumber(fields?.getTextInputValue('amount') ?? '');
      if (!role || amount === null || amount <= 0) {
        return {
          error: t('config.invalid', {
            field: t('panel.collect.amountLabel'),
            hint: t('config.hints.coins'),
          }),
        };
      }
      roleRewards.set(guildId, role.id, amount);
      return {
        banner: `${emojis.success} ${t('incomeAdmin.set', { role: `<@&${role.id}>`, amount: coins(amount) })}`,
      };
    },

    remove({ t, guildId, value }) {
      if (value) roleRewards.remove(guildId, value);
      return { banner: `${emojis.success} ${t('incomeAdmin.removed', { role: `<@&${value}>` })}` };
    },

    clear({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'clear' },
          banner: `${emojis.warning} ${t('panel.collect.confirmClear')}`,
        };
      }
      return {
        banner: `${emojis.success} ${t('incomeAdmin.cleared', { count: roleRewards.clear(guildId) })}`,
      };
    },
  },
};
