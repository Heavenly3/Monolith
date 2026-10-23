import {
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  type GuildBasedChannel,
  type GuildMember,
  type User,
} from 'discord.js';
import { formatDuration, formatNumber, levels } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { defineCommand } from '../../framework/types.ts';
import { activityOf, pendingRoles, syncRewardRoles } from '../../services/levelUp.ts';
import * as ui from '../../ui/index.ts';
import { emojis, progressBar, relativeTime } from '../../ui/index.ts';

const multiplierText = (percent: number): string =>
  `×${(percent / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/**
 * Rank card of `target`. With their member and the channel it also shows the
 * multiplier there, the messages left and the cooldown; the viewer's own card
 * offers to fix reward roles that drifted from the level.
 */
function rankCard(
  t: Translator,
  guildId: string,
  target: User,
  member: GuildMember | null,
  channel: GuildBasedChannel | null,
  viewerId: string,
) {
  if (target.bot) return ui.info(`${emojis.bot} ${t('common.botsNoAccount')}`);
  const progress = levels.progressOf(guildId, target.id);
  if (progress.xp === 0) return ui.info(`${emojis.level} ${t('levels.noXp', { user: target })}`);

  const rank = levels.rankOf(guildId, target.id);
  const next = levels.rewards(guildId).find((reward) => reward.level > progress.level);
  const maxed = progress.needed === 0;
  const percent = Math.floor(progress.ratio * 100);
  const multiplier =
    member && channel ? levels.multiplierFor(guildId, activityOf(member, channel)) : null;
  const messagesLeft = maxed
    ? null
    : levels.messagesUntil(guildId, progress.needed - progress.current, multiplier?.total);
  const cooldown = levels.cooldownLeft(guildId, target.id);

  const details = [
    multiplier &&
      multiplier.total !== 100 &&
      `${emojis.sparkle} ${t('levels.multiplier')} **${multiplierText(multiplier.total)}** (${t(
        'levels.multiplierParts',
        {
          role: multiplier.role === null ? '—' : multiplierText(multiplier.role),
          channel: multiplier.channel === null ? '—' : multiplierText(multiplier.channel),
        },
      )})`,
    messagesLeft !== null &&
      `${emojis.message} ${t('levels.messagesLeft', {
        messages: formatNumber(messagesLeft),
        level: progress.level + 1,
      })}`,
    target.id === viewerId &&
      `${emojis.clock} ${
        cooldown > 0
          ? t('levels.nextXpIn', { time: relativeTime(Date.now() + cooldown) })
          : t('levels.nextXpNow')
      }`,
  ].filter(Boolean);

  const card = new ui.Card('levels')
    .header(
      ui.featureTitle(t, 'levels'),
      t('levels.rankSubtitle', { user: target }),
      target.displayAvatarURL({ size: 128 }),
    )
    .divider()
    .text(
      [
        `## ${emojis.level} ${t('levels.level')} ${progress.level}`,
        maxed
          ? `${progressBar(1)} **${t('levels.maxLevel')}**`
          : `${progressBar(progress.ratio)} **${percent}%**`,
        !maxed &&
          `-# ${t('levels.progress', {
            current: formatNumber(progress.current),
            needed: formatNumber(progress.needed),
            next: progress.level + 1,
          })}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .divider()
    .fields([
      { name: `${emojis.rank} ${t('levels.rank')}`, value: rank ? `**#${rank}**` : '—' },
      { name: `${emojis.xp} ${t('levels.xp')}`, value: `**${formatNumber(progress.xp)}**` },
      {
        name: `${emojis.message} ${t('levels.messages')}`,
        value: `**${formatNumber(progress.messages)}**`,
      },
      progress.voiceMinutes > 0 && {
        name: `${emojis.voice} ${t('levels.voice')}`,
        value: `**${formatDuration(progress.voiceMinutes * 60)}**`,
      },
    ]);
  if (details.length) card.text(details.join('\n'));

  // Only the member can fix their own roles, and only when something is off.
  if (member && target.id === viewerId) {
    const drift = pendingRoles(member, levels.rewardRolesFor(guildId, progress.level));
    if (drift.give.length || drift.take.length) {
      card
        .text(`${emojis.warning} ${t('levels.outOfSync')}`)
        .actions([
          new ButtonBuilder()
            .setCustomId(`rank:sync:${target.id}`)
            .setLabel(t('levels.syncButton'))
            .setEmoji(emojis.role)
            .setStyle(ButtonStyle.Primary),
        ]);
    }
  }

  return card
    .footer(next ? t('levels.nextReward', { role: `<@&${next.roleId}>`, level: next.level }) : null)
    .toMessage();
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription("See your level and experience, or another member's.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('Member to check')),

  async execute(interaction, { t, guildId }) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const member =
      target.id === interaction.user.id
        ? interaction.member
        : interaction.options.getMember('user');
    return interaction.reply(
      rankCard(t, guildId, target, member, interaction.channel, interaction.user.id),
    );
  },

  userMenu: {
    nameKey: 'levels.menuName',
    async execute(interaction, { t, guildId }) {
      const card = rankCard(
        t,
        guildId,
        interaction.targetUser,
        interaction.targetMember,
        interaction.channel,
        interaction.user.id,
      );
      return interaction.reply({ ...card, flags: card.flags | MessageFlags.Ephemeral });
    },
  },

  components: {
    async sync(interaction, [userId = ''], { t, guildId }) {
      if (interaction.user.id !== userId) {
        return interaction.reply(ui.info(t('common.notYours', { command: '/rank' })));
      }
      await syncRewardRoles(interaction.member, levels.getMember(guildId, userId).level);
      return interaction.reply(ui.success(t('levels.synced')));
    },
  },
});
