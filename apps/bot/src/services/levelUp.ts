// What happens in Discord after a member earns XP: reward roles are kept in
// sync with their level, and level-ups are announced where the server chose.
import type { GuildMember, GuildTextBasedChannel } from 'discord.js';
import { accounts, formatNumber, levels, logger, settings, type XpGain } from '@mythcore/core';
import { translatorFor } from '../framework/context.ts';
import * as ui from '../ui/index.ts';
import { coins, emojis } from '../ui/index.ts';

const log = logger.child('levels');

/**
 * Gives the reward roles the member's level earns and removes the ones it no
 * longer does. Only touches roles the bot can manage; costs no API call when
 * nothing changes, so it runs after every XP gain and heals any drift (for
 * example after an admin changes XP from the dashboard).
 */
export async function syncRewardRoles(member: GuildMember, level: number): Promise<void> {
  const { give, take } = levels.rewardRolesFor(member.guild.id, level);
  const manageable = (id: string) => member.guild.roles.cache.get(id)?.editable ?? false;
  const add = give.filter((id) => !member.roles.cache.has(id) && manageable(id));
  const remove = take.filter((id) => member.roles.cache.has(id) && manageable(id));
  try {
    if (add.length) await member.roles.add(add, `Level ${level} reward`);
    if (remove.length) await member.roles.remove(remove, `Level ${level} reward`);
  } catch (error) {
    log.warn(`Could not update reward roles in ${member.guild.id}:`, (error as Error).message);
  }
}

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
  await syncRewardRoles(member, gain.after);
  if (gain.levelsGained > 0) await announce(member, gain, source);
}
