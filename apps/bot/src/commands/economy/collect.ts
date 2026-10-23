import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, cooldowns, roleRewards } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'collect.cooldown',

  data: new SlashCommandBuilder()
    .setName('collect')
    .setDescription('Collect the income of your roles.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    const { user, member } = interaction;
    const remaining = cooldowns.remaining(guildId, user.id, 'collect');
    if (remaining) return interaction.reply(ui.cooldown(t, remaining, t('collect.action')));

    const rewards = roleRewards.forRoles(guildId, member.roles.cache.keys());
    if (rewards.length === 0) {
      return interaction.reply(
        ui.info(`${emojis.static} ${t('collect.noRewards', { command: mention('config') })}`),
      );
    }

    const total = rewards.reduce((sum, reward) => sum + reward.amount, 0);
    accounts.getAccount(guildId, user);
    accounts.credit(guildId, user.id, total, 'collect');
    const readyAt = cooldowns.startConfigured(guildId, user.id, 'collect');

    const card = new ui.Card('collect')
      .header(
        `${emojis.collect} ${t('collect.title')}`,
        t('collect.body', { amount: coins(total) }),
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .text(rewards.map((reward) => `<@&${reward.roleId}> · ${coins(reward.amount)}`).join('\n'))
      .divider()
      .stats([
        {
          name: `${emojis.wallet} ${t('common.wallet')}`,
          value: coins(accounts.findAccount(guildId, user.id)!.wallet),
        },
        { name: `${emojis.cooldown} ${t('collect.next')}`, value: relativeTime(readyAt) },
      ])
      .footer(t('features.collect'));

    return interaction.reply(card.toMessage());
  },
});
