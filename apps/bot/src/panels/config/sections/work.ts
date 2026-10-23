import { truncate, work } from '@monolith/core';
import { emojis } from '../../../ui/index.ts';
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

export const workSection: Section = {
  icon: 'work',
  color: 'work',

  render(t, { guildId }) {
    const messages = work.getMessages(guildId, t.list('work.defaultMessages'));
    const lines = messages.map(
      (message, i) => `\`${String(i + 1).padStart(2)}\` ${truncate(message, 120)}`,
    );
    return {
      blocks: [
        categoryLines(guildId, 'work', t),
        `### ${emojis.description} ${t('panel.work.messages')} (${messages.length}/${work.MAX_MESSAGES})\n${
          lines.length ? list(lines, t) : t('workAdmin.noMessages')
        }${work.usesBuiltIn(guildId) ? `\n-# ${t('workAdmin.usingDefaults')}` : ''}`,
      ],
      rows: [
        [
          editButton(t, 'work'),
          button('work', 'add', t('panel.work.add'), emojis.edit, ButtonStyle.Success),
          button('work', 'reset', t('config.reset'), emojis.reset, ButtonStyle.Danger),
        ],
        [
          picker(
            'work',
            'remove',
            t('panel.work.removePlaceholder'),
            messages.map((message, i) => ({ label: `#${i + 1} ${message}`, value: String(i) })),
          ),
        ],
      ],
    };
  },

  actions: {
    add({ t, guildId }) {
      if (work.getMessages(guildId, t.list('work.defaultMessages')).length >= work.MAX_MESSAGES) {
        return { error: t('workAdmin.full', { max: work.MAX_MESSAGES }) };
      }
      return {
        modal: modal('work', 'saveMessage', t('panel.work.modalTitle')).addLabelComponents(
          textField('message', t('panel.work.messageLabel'), {
            description: t('panel.work.messageHint'),
            paragraph: true,
            max: 300,
          }),
        ),
      };
    },

    saveMessage({ t, guildId, fields }) {
      const builtIn = t.list('work.defaultMessages');
      const message = fields?.getTextInputValue('message').trim() ?? '';
      if (!message) return { error: t('workAdmin.missing') };
      if (work.addMessage(guildId, message, builtIn) === 'full') {
        return { error: t('workAdmin.full', { max: work.MAX_MESSAGES }) };
      }
      const count = work.getMessages(guildId, builtIn).length;
      return { banner: `${emojis.success} ${t('workAdmin.added', { n: count })}` };
    },

    remove({ t, guildId, value }) {
      const removed = work.removeMessage(guildId, Number(value), t.list('work.defaultMessages'));
      if (removed === null) return { error: t('workAdmin.missing') };
      return {
        banner: `${emojis.success} ${t('workAdmin.removed', { message: truncate(removed, 200) })}`,
      };
    },

    reset({ t, guildId, args }) {
      if (!confirmed(args)) {
        return {
          confirm: { action: 'reset' },
          banner: `${emojis.warning} ${t('panel.work.confirmReset')}`,
        };
      }
      work.resetAll(guildId);
      return { banner: `${emojis.reset} ${t('workAdmin.reset')}` };
    },
  },
};
