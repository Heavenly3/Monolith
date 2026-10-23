import {
  CheckboxBuilder,
  LabelBuilder,
  RadioGroupBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import { formatNumber, levels, parseWholeNumber, type XpAction } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { syncRewardRoles } from '../../../services/levelUp.ts';
import { emojis } from '../../../ui/index.ts';
import {
  ButtonStyle,
  button,
  compactLines,
  editCategoryButton,
  list,
  modal,
  picker,
  textField,
} from '../shared.ts';
import { confirmed, type Section } from '../types.ts';

const CATEGORIES = [
  ['levels', 'xp'],
  ['levelCurve', 'up'],
  ['levelFormula', 'edit'],
  ['levelMultipliers', 'sparkle'],
  ['levelVoice', 'voice'],
  ['levelAnnounce', 'levelUp'],
  ['levelFilters', 'signal'],
  ['levelRoles', 'role'],
] as const;

const checkbox = (id: string, label: string, description: string) =>
  new LabelBuilder()
    .setLabel(label)
    .setDescription(description)
    .setCheckboxComponent(new CheckboxBuilder().setCustomId(id));

function rewardModal(t: Translator) {
  return modal('levels', 'saveReward', t('panel.levels.rewardTitle')).addLabelComponents(
    textField('level', t('panel.levels.levelLabel'), {
      description: t('config.hints.number'),
      max: 4,
    }),
    new LabelBuilder()
      .setLabel(t('panel.levels.roleLabel'))
      .setRoleSelectMenuComponent(
        new RoleSelectMenuBuilder().setCustomId('role').setRequired(true),
      ),
    checkbox('keep', t('panel.levels.keepLabel'), t('panel.levels.keepHint')),
    checkbox('noSync', t('panel.levels.noSyncLabel'), t('panel.levels.noSyncHint')),
  );
}

/** Flags of a reward, as a short suffix for lists. */
export function rewardFlags(t: Translator, reward: { keep?: boolean; noSync?: boolean }): string {
  const flags = [
    reward.keep && t('panel.levels.keepFlag'),
    reward.noSync && t('panel.levels.noSyncFlag'),
  ];
  const shown = flags.filter(Boolean);
  return shown.length ? ` · *${shown.join(' · ')}*` : '';
}

function xpModal(t: Translator) {
  return modal('levels', 'saveXp', t('panel.levels.adjustTitle')).addLabelComponents(
    new LabelBuilder()
      .setLabel(t('panel.levels.member'))
      .setUserSelectMenuComponent(
        new UserSelectMenuBuilder().setCustomId('user').setRequired(true),
      ),
    new LabelBuilder().setLabel(t('panel.levels.action')).setRadioGroupComponent(
      new RadioGroupBuilder().setCustomId('action').addOptions(
        levels.XP_ACTIONS.map((value) => ({
          label: t(`panel.levels.actions.${value}`),
          value,
          default: value === 'add',
        })),
      ),
    ),
    textField('amount', t('panel.levels.amount'), {
      description: t('panel.levels.amountHint'),
      required: false,
      max: 10,
    }),
  );
}

export const levelsSection: Section = {
  icon: 'level',
  color: 'levels',

  render(t, { guildId, guild }) {
    const stats = levels.stats(guildId);
    const rewards = levels.rewards(guildId);
    const rewardLines = rewards.map(
      (reward) =>
        `${emojis.level} ${t('levels.level')} **${reward.level}** → <@&${reward.roleId}>${rewardFlags(t, reward)}`,
    );
    return {
      blocks: [
        `${emojis.message} ${t('panel.levels.stats', {
          members: formatNumber(stats.members),
          xp: formatNumber(stats.totalXp),
          top: stats.topLevel,
        })}`,
        CATEGORIES.map(
          ([category, icon]) =>
            `### ${emojis[icon]} ${t(`config.categories.${category}.label`)}\n${compactLines(guildId, category, t)}`,
        ).join('\n'),
        `### ${emojis.role} ${t('config.categories.levelRewards.label')} (${rewards.length}/${levels.MAX_REWARDS})\n${
          rewardLines.length ? list(rewardLines, t, 10) : t('panel.levels.noRewards')
        }`,
        `-# ${t('panel.levels.hint')}`,
      ],
      rows: [
        CATEGORIES.slice(0, 4).map(([category, icon]) =>
          editCategoryButton(t, 'levels', category, emojis[icon]),
        ),
        CATEGORIES.slice(4).map(([category, icon]) =>
          editCategoryButton(t, 'levels', category, emojis[icon]),
        ),
        [
          button(
            'levels',
            'addReward',
            t('panel.levels.addReward'),
            emojis.role,
            ButtonStyle.Success,
          ),
          button('levels', 'adjust', t('panel.levels.adjust'), emojis.xp, ButtonStyle.Primary),
          button(
            'levels',
            'resetAll',
            t('panel.levels.resetAll'),
            emojis.reset,
            ButtonStyle.Danger,
          ),
        ],
        [
          picker(
            'levels',
            'removeReward',
            t('panel.levels.removeReward'),
            rewards.map((reward) => ({
              label: `${t('levels.level')} ${reward.level} → @${guild.roles.cache.get(reward.roleId)?.name ?? reward.roleId}`,
              value: reward.roleId,
            })),
          ),
        ],
      ],
    };
  },

  actions: {
    addReward({ t, guildId }) {
      if (levels.rewards(guildId).length >= levels.MAX_REWARDS) {
        return { error: t('levelsAdmin.full', { max: levels.MAX_REWARDS }) };
      }
      return { modal: rewardModal(t) };
    },

    saveReward({ t, guildId, fields, interaction }) {
      if (!fields) return { error: t('config.unknown') };
      const level = parseWholeNumber(fields.getTextInputValue('level'));
      const role = fields.getSelectedRoles('role', true).first();
      if (level === null || level < 1 || level > 1000) {
        return {
          error: t('config.invalid', {
            field: t('panel.levels.levelLabel'),
            hint: t('config.hints.number'),
          }),
        };
      }
      if (!role || role.id === guildId || ('managed' in role && role.managed)) {
        return { error: t('levelsAdmin.badRole') };
      }
      const reward = {
        level,
        roleId: role.id,
        keep: fields.getCheckbox('keep') || undefined,
        noSync: fields.getCheckbox('noSync') || undefined,
      };
      if (levels.addReward(guildId, reward) === 'full') {
        return { error: t('levelsAdmin.full', { max: levels.MAX_REWARDS }) };
      }
      const editable = interaction.guild.roles.cache.get(role.id)?.editable ?? false;
      return {
        banner: [
          `${emojis.success} ${t('levelsAdmin.rewardAdded', { role: `<@&${role.id}>`, level })}`,
          !editable && `${emojis.warning} ${t('shop.roleNotEditable', { role: `<@&${role.id}>` })}`,
        ]
          .filter(Boolean)
          .join('\n'),
      };
    },

    removeReward({ t, guildId, value }) {
      if (!value || !levels.removeReward(guildId, value))
        return { error: t('levelsAdmin.missing') };
      return {
        banner: `${emojis.success} ${t('levelsAdmin.rewardRemoved', { role: `<@&${value}>` })}`,
      };
    },

    adjust: ({ t }) => ({ modal: xpModal(t) }),

    async saveXp({ t, guildId, fields, interaction }) {
      if (!fields) return { error: t('config.unknown') };
      const user = fields.getSelectedUsers('user', true).first()!;
      const action = (fields.getRadioGroup('action') ?? 'add') as XpAction;
      const amount = parseWholeNumber(fields.getTextInputValue('amount')) ?? 0;
      if (user.bot) return { error: t('common.botsNoAccount') };
      if (action !== 'reset' && amount === 0 && action !== 'setXp' && action !== 'setLevel') {
        return { error: t('panel.members.amountRequired') };
      }

      const gain = levels.adjust(guildId, user, action, amount);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member) await syncRewardRoles(member, gain.after);
      return {
        banner: `${emojis.success} ${t('levelsAdmin.adjusted', {
          user: `${user}`,
          level: gain.after,
          xp: formatNumber(gain.xp),
        })}`,
      };
    },

    resetAll({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'resetAll' },
          banner: `${emojis.warning} ${t('panel.levels.confirmResetAll')}`,
        };
      }
      const count = levels.resetAll(guildId);
      return { banner: `${emojis.reset} ${t('levelsAdmin.resetAll', { count })}` };
    },
  },
};
