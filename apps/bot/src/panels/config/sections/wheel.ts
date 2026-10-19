import { formatNumber, parseWholeNumber, wheel } from '@mythcore/core';
import { emojis, rewardLabel } from '../../../ui/index.ts';
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

export const wheelSection: Section = {
  icon: 'wheel',
  color: 'wheel',

  render(t, { guildId }) {
    const rewards = wheel.getRewards(guildId);
    const lines = rewards.map(
      (reward, i) => `\`${String(i + 1).padStart(2)}\` ${rewardLabel(reward, t)}`,
    );
    return {
      blocks: [
        categoryLines(guildId, 'wheel', t),
        `### ${emojis.money} ${t('panel.wheel.prizes')} (${rewards.length}/${wheel.MAX_REWARDS})\n${
          lines.length ? list(lines, t, 15) : t('panel.wheel.empty')
        }`,
      ],
      rows: [
        [
          editButton(t, 'wheel'),
          button('wheel', 'add', t('panel.wheel.add'), emojis.money, ButtonStyle.Success),
          button(
            'wheel',
            'resetPrizes',
            t('panel.wheel.resetPrizes'),
            emojis.reset,
            ButtonStyle.Danger,
          ),
        ],
        [
          picker(
            'wheel',
            'remove',
            t('panel.wheel.removePlaceholder'),
            rewards.map((reward, i) => ({
              label: `#${i + 1} ${reward.name ?? ''} ${formatNumber(reward.amount)}`.replace(
                /\s+/g,
                ' ',
              ),
              value: String(i),
            })),
          ),
        ],
      ],
    };
  },

  actions: {
    add({ t, guildId }) {
      if (wheel.getRewards(guildId).length >= wheel.MAX_REWARDS) {
        return { error: t('wheelAdmin.full', { max: wheel.MAX_REWARDS }) };
      }
      return {
        modal: modal('wheel', 'savePrize', t('panel.wheel.modalTitle')).addLabelComponents(
          textField('amount', t('panel.wheel.amountLabel'), {
            description: t('config.hints.coins'),
            max: 12,
          }),
          textField('label', t('panel.wheel.labelLabel'), { required: false, max: 50 }),
        ),
      };
    },

    savePrize({ t, guildId, fields }) {
      const amount = parseWholeNumber(fields?.getTextInputValue('amount') ?? '');
      if (amount === null) {
        return {
          error: t('config.invalid', {
            field: t('panel.wheel.amountLabel'),
            hint: t('config.hints.coins'),
          }),
        };
      }
      const reward = { name: fields?.getTextInputValue('label').trim() || null, amount };
      if (wheel.addReward(guildId, reward) === 'full') {
        return { error: t('wheelAdmin.full', { max: wheel.MAX_REWARDS }) };
      }
      return {
        banner: `${emojis.success} ${t('wheelAdmin.added', { label: rewardLabel(reward, t) })}`,
      };
    },

    remove({ t, guildId, value }) {
      const removed = wheel.removeReward(guildId, Number(value));
      if (!removed) return { error: t('wheelAdmin.missing') };
      return {
        banner: `${emojis.success} ${t('wheelAdmin.removed', { label: rewardLabel(removed, t) })}`,
      };
    },

    resetPrizes({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'resetPrizes' },
          banner: `${emojis.warning} ${t('panel.wheel.confirmReset')}`,
        };
      }
      wheel.resetRewards(guildId);
      return { banner: `${emojis.reset} ${t('wheelAdmin.reset')}` };
    },
  },
};
