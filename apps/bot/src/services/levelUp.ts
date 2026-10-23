// What happens in Discord after a member earns XP: reward roles are kept in
// sync with their level, and level-ups are announced where the server chose.
import type { GuildBasedChannel, GuildMember, GuildTextBasedChannel } from 'discord.js';
import {
  accounts,
  formatNumber,
  levels,
  logger,
  settings,
  type ActivityContext,
  type RoleChanges,
  type XpGain,
} from '@monolith/core';
import { translatorFor } from '../framework/context.ts';
import * as ui from '../ui/index.ts';
import { coins, emojis } from '../ui/index.ts';

const log = logger.child('levels');

/**
 * Where a member is earning XP, for ignore lists and multipliers. Threads
 * count as their parent channel; roles go highest first.
 */
export function activityOf(member: GuildMember, channel: GuildBasedChannel): ActivityContext {
  const base = channel.isThread() ? (channel.parent ?? channel) : channel;
  return {
    channelId: base.id,
    categoryId: base.parentId,
    roleIds: [...member.roles.cache.sort((a, b) => b.position - a.position).keys()],
  };
}

/** Role changes the bot can actually make for this member (missing roles only, editable only). */
export function pendingRoles(member: GuildMember, { give, take }: RoleChanges): RoleChanges {
  const manageable = (id: string) => member.guild.roles.cache.get(id)?.editable ?? false;
  return {
    give: [...new Set(give)].filter((id) => !member.roles.cache.has(id) && manageable(id)),
    take: [...new Set(take)].filter((id) => member.roles.cache.has(id) && manageable(id)),
  };
}

async function applyRoles(member: GuildMember, changes: RoleChanges, level: number) {
  const { give, take } = pendingRoles(member, changes);
  try {
    if (give.length) await member.roles.add(give, `Level ${level} reward`);
    if (take.length) await member.roles.remove(take, `Level ${level} reward`);
  } catch (error) {
    log.warn(`Could not update reward roles in ${member.guild.id}:`, (error as Error).message);
  }
}

/**
 * Gives every reward role the member's level earns and removes the ones it
 * no longer does, whatever the sync mode (admin changes and the sync button).
 * Costs no API call when nothing changes.
 */
export const syncRewardRoles = (member: GuildMember, level: number): Promise<void> =>
  applyRoles(member, levels.rewardRolesFor(member.guild.id, level), level);

/** Replaces {name} placeholders; unknown ones are left as typed. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

/** Highest reward role unlocked between the old and the new level, if any. */
function unlockedReward(guildId: string, gain: XpGain) {
  for (let level = gain.after; level > gain.before; level--) {
    const reward = levels.rewardAt(guildId, level);
    if (reward) return reward;
  }
  return undefined;
}

async function announce(member: GuildMember, gain: XpGain, source: GuildTextBasedChannel | null) {
  const guildId = member.guild.id;
  const mode = settings.get(guildId, 'levels.announce');
  if (mode === 'off') return;

  const reward = unlockedReward(guildId, gain);
  const every = settings.get(guildId, 'levels.announceEvery');
  if (!reward && gain.after % every !== 0) return;

  const t = translatorFor(guildId, accounts.getProfile(member.id)?.locale);
  const template =
    settings.get(guildId, 'levels.announceMessage') ??
    t(reward ? 'levels.announceReward' : 'levels.announce');
  const text = fillTemplate(template, {
    user: `${member}`,
    username: member.displayName,
    level: String(gain.after),
    xp: formatNumber(gain.xp),
    rank: String(levels.rankOf(guildId, member.id) ?? '—'),
    role: reward ? `<@&${reward.roleId}>` : '',
    server: member.guild.name,
  });

  const card = new ui.Card('levels')
    .header(
      `${emojis.levelUp} ${t('levels.announceTitle')}`,
      null,
      member.displayAvatarURL({ size: 128 }),
    )
    .text(text);
  if (gain.coins > 0)
    card.text(`-# ${emojis.coin} ${t('levels.coins', { amount: coins(gain.coins) })}`);
  const message = card.toChannelMessage([member.id]);

  try {
    if (mode === 'dm') {
      await member.send(message);
      return;
    }
    const channelId = settings.get(guildId, 'levels.announceChannel');
    const target =
      mode === 'custom' && channelId ? member.guild.channels.cache.get(channelId) : source;
    if (
      target?.isTextBased() &&
      target.permissionsFor(member.guild.members.me!)?.has('SendMessages')
    ) {
      await target.send(message);
    }
  } catch (error) {
    log.warn(`Could not announce a level-up in ${guildId}:`, (error as Error).message);
  }
}

/** Runs after any XP gain: keeps roles in sync and announces new levels. */
export async function afterXpGain(
  member: GuildMember,
  gain: XpGain,
  source: GuildTextBasedChannel | null,
): Promise<void> {
  const changes = levels.roleChangesFor(member.guild.id, gain.before, gain.after);
  if (changes) await applyRoles(member, changes, gain.after);
  if (gain.levelsGained > 0) await announce(member, gain, source);
}
