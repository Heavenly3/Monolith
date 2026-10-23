import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  type GuildBasedChannel,
  type GuildMember,
  type User,
} from 'discord.js';
import { formatDuration, formatNumber, levels, settings } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import {
  defineCommand,
  type CommandInteraction,
  type UserMenuInteraction,
} from '../../framework/types.ts';
import { activityOf, pendingRoles, syncRewardRoles } from '../../services/levelUp.ts';
import { designOf, imageData, renderRankCard } from '../../services/rankCard.ts';
import * as ui from '../../ui/index.ts';
import { emojis, progressBar, relativeTime } from '../../ui/index.ts';

const multiplierText = (percent: number): string =>
  `×${(percent / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

/** Button that fixes the viewer's own reward roles when they drifted from the level. */
function syncButton(
  t: Translator,
  guildId: string,
  member: GuildMember | null,
  targetId: string,
  viewerId: string,
  level: number,
): ButtonBuilder | null {
  if (!member || targetId !== viewerId) return null;
  const drift = pendingRoles(member, levels.rewardRolesFor(guildId, level));
  if (!drift.give.length && !drift.take.length) return null;
  return new ButtonBuilder()
    .setCustomId(`rank:sync:${targetId}`)
    .setLabel(t('levels.syncButton'))
    .setEmoji(emojis.role)
    .setStyle(ButtonStyle.Primary);
}

/** Why there is nothing to show (a bot, or no XP yet), or null. */
function emptyNotice(t: Translator, guildId: string, target: User) {
  if (target.bot) return ui.info(`${emojis.bot} ${t('common.botsNoAccount')}`);
  if (levels.getMember(guildId, target.id).xp === 0) {
    return ui.info(`${emojis.level} ${t('levels.noXp', { user: target })}`);
  }
  return null;
}

/** Short text in the spirit of Polaris: level, rank, a bar and the totals. */
function compactText(t: Translator, guildId: string, target: User, name: string): string {
  const progress = levels.progressOf(guildId, target.id);
  const rank = levels.rankOf(guildId, target.id);
  const maxed = progress.needed === 0;
  const next = levels.rewards(guildId).find((reward) => reward.level > progress.level);
  const left = maxed ? null : levels.messagesUntil(guildId, progress.needed - progress.current);
  const heading = [
    `${emojis.level} **${name}**`,
    `${t('levels.level')} **${progress.level}**`,
    rank && `${t('levels.rank')} **#${rank}**`,
  ];
  const bar = maxed
    ? `${progressBar(1)} **${t('levels.maxLevel')}**`
    : `${progressBar(progress.ratio)} **${Math.floor(progress.ratio * 100)}%** · ${formatNumber(
        progress.current,
      )} / ${formatNumber(progress.needed)} XP`;
  const totals = [
    `${formatNumber(progress.xp)} XP`,
    `${formatNumber(progress.messages)} ${t('levels.messages').toLowerCase()}`,
    left !== null &&
      t('levels.messagesLeft', { messages: formatNumber(left), level: progress.level + 1 }),
    next && t('levels.nextReward', { role: `<@&${next.roleId}>`, level: next.level }),
  ];
  return [
    heading.filter(Boolean).join(' · '),
    bar,
    `-# ${totals.filter(Boolean).join(' · ')}`,
  ].join('\n');
}

/** A small embed in the spirit of Polaris, in the server's accent colour. */
function rankEmbed(t: Translator, guildId: string, target: User, name: string): EmbedBuilder {
  const progress = levels.progressOf(guildId, target.id);
  const rank = levels.rankOf(guildId, target.id);
  const maxed = progress.needed === 0;
  const next = levels.rewards(guildId).find((reward) => reward.level > progress.level);
  const accent = settings.get(guildId, 'levels.rankAccent');
  const embed = new EmbedBuilder()
    .setColor(Number.parseInt(accent.slice(1), 16))
    .setAuthor({ name, iconURL: target.displayAvatarURL({ size: 64 }) })
    .setDescription(
      [
        `**${t('levels.level')} ${progress.level}**${rank ? ` (${t('levels.rank')} #${rank})` : ''}`,
        maxed
          ? `${progressBar(1)} ${t('levels.maxLevel')}`
          : `${progressBar(progress.ratio)} ${formatNumber(progress.current)} / ${formatNumber(
              progress.needed,
            )} XP (${Math.floor(progress.ratio * 100)}%)`,
      ].join('\n'),
    )
    .addFields(
      { name: t('levels.xp'), value: formatNumber(progress.xp), inline: true },
      { name: t('levels.messages'), value: formatNumber(progress.messages), inline: true },
    );
  if (next) {
    embed.addFields({
      name: t('levels.nextRewardTitle'),
      value: `<@&${next.roleId}> · ${t('levels.level')} ${next.level}`,
      inline: true,
    });
  }
  return embed;
}

/** The rank image as an attachment. */
async function rankImage(t: Translator, guildId: string, target: User, name: string) {
  const progress = levels.progressOf(guildId, target.id);
  const png = renderRankCard({
    name,
    avatar: await imageData(target.displayAvatarURL({ extension: 'png', size: 256 })),
    level: progress.level,
    rank: levels.rankOf(guildId, target.id),
    xp: progress.xp,
    current: progress.current,
    needed: progress.needed,
    messages: progress.messages,
    design: await designOf(guildId),
    labels: {
      level: t('levels.level'),
      rank: t('levels.rank'),
      xp: 'XP',
      messages: t('levels.messages'),
      max: t('levels.maxLevel'),
    },
  });
  return new AttachmentBuilder(png, { name: 'rank.png' });
}

/**
 * The full card of `target`. With their member and the channel it also shows
 * the multiplier there, the messages left and the cooldown.
 */
function detailedCard(
  t: Translator,
  guildId: string,
  target: User,
  member: GuildMember | null,
  channel: GuildBasedChannel | null,
  viewerId: string,
) {
  const progress = levels.progressOf(guildId, target.id);
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

  const fix = syncButton(t, guildId, member, target.id, viewerId, progress.level);
  if (fix) card.text(`${emojis.warning} ${t('levels.outOfSync')}`).actions([fix]);

  return card
    .footer(next ? t('levels.nextReward', { role: `<@&${next.roleId}>`, level: next.level }) : null)
    .toMessage();
}

/**
 * Answers /rank (or the member menu) in the style the server chose. The
 * image is drawn after deferring, since it downloads the avatar first.
 */
async function answer(
  interaction: CommandInteraction | UserMenuInteraction,
  guildId: string,
  t: Translator,
  target: User,
  member: GuildMember | null,
  ephemeral: boolean,
) {
  const notice = emptyNotice(t, guildId, target);
  if (notice) return interaction.reply(notice);
  const flags = ephemeral ? MessageFlags.Ephemeral : undefined;

  const style = settings.get(guildId, 'levels.rankStyle');
  if (style === 'detailed') {
    const card = detailedCard(t, guildId, target, member, interaction.channel, interaction.user.id);
    return interaction.reply({ ...card, flags: card.flags | (flags ?? 0) });
  }

  const name = member?.displayName ?? target.displayName;
  const level = levels.getMember(guildId, target.id).level;
  const fix = syncButton(t, guildId, member, target.id, interaction.user.id, level);
  const components = fix ? [new ActionRowBuilder<ButtonBuilder>().addComponents(fix)] : [];
  const warning = fix ? `${emojis.warning} ${t('levels.outOfSync')}` : null;

  if (style === 'embed') {
    return interaction.reply({
      content: warning ?? undefined,
      embeds: [rankEmbed(t, guildId, target, name)],
      components,
      flags,
      allowedMentions: { parse: [] },
    });
  }
  if (style === 'compact') {
    return interaction.reply({
      content: [compactText(t, guildId, target, name), warning].filter(Boolean).join('\n'),
      components,
      flags,
      allowedMentions: { parse: [] },
    });
  }
  await interaction.deferReply({ flags });
  return interaction.editReply({
    content: warning ?? '',
    files: [await rankImage(t, guildId, target, name)],
    components,
    allowedMentions: { parse: [] },
  });
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
    return answer(interaction, guildId, t, target, member, false);
  },

  userMenu: {
    nameKey: 'levels.menuName',
    async execute(interaction, { t, guildId }) {
      return answer(
        interaction,
        guildId,
        t,
        interaction.targetUser,
        interaction.targetMember,
        true,
      );
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
