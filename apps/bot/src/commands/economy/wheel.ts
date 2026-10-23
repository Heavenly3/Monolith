import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { accounts, cooldowns, pick, wheel } from '@monolith/core';
import { defineCommand } from '../../framework/types.ts';
import { mention } from '../../framework/mentions.ts';
import { wait } from '../../framework/respond.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime, rewardLabel } from '../../ui/index.ts';

export default defineCommand({
  cooldown: 'wheel.cooldown',

  data: new SlashCommandBuilder()
    .setName('wheel')
    .setDescription('Spin the Wheel of Fortune for a free prize.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    const remaining = cooldowns.remaining(guildId, user.id, 'wheel');
    if (remaining) return interaction.reply(ui.cooldown(t, remaining, t('wheel.action')));

    const rewards = wheel.getRewards(guildId);
    if (rewards.length === 0) {
      return interaction.reply(ui.warning(t('wheel.empty', { command: mention('config') })));
    }

    // The prize is paid before the animation so nothing is lost if it fails.
    const reward = pick(rewards);
    accounts.getAccount(guildId, user);
    if (reward.amount > 0) accounts.credit(guildId, user.id, reward.amount, 'wheel');
    const readyAt = cooldowns.startConfigured(guildId, user.id, 'wheel');

    const spinning = () =>
      new ui.Card('wheel').header(
        ui.featureTitle(t, 'wheel'),
        `${emojis.spinning} ${t('wheel.spinning', { label: rewardLabel(pick(rewards), t) })}`,
      );

    await interaction.reply(spinning().toMessage());
    for (let i = 0; i < 2; i++) {
      await wait(900);
      await interaction.editReply(spinning().toEdit());
    }
    await wait(900);

    const won = reward.amount > 0;
    const label = rewardLabel(reward, t);
    const card = new ui.Card(won ? 'wheel' : 'neutral')
      .header(
        ui.featureTitle(t, 'wheel'),
        won
          ? `${emojis.realm} ${t('wheel.won', { label })}`
          : `${emojis.wisp} ${t('wheel.lost', { label })}`,
        user.displayAvatarURL({ size: 128 }),
      )
      .divider()
      .stats([
        {
          name: `${emojis.wallet} ${t('common.wallet')}`,
          value: coins(accounts.findAccount(guildId, user.id)!.wallet),
        },
        { name: `${emojis.cooldown} ${t('wheel.next')}`, value: relativeTime(readyAt) },
      ])
      .footer();

    return interaction.editReply(card.toEdit());
  },
});
