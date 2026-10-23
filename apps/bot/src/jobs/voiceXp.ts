import type { Client } from 'discord.js';
import { levels, settings } from '@monolith/core';
import { afterXpGain } from '../services/levelUp.ts';

/**
 * Every minute, members talking in voice earn XP: at least two people who
 * are not bots, outside the AFK channel, and not deafened.
 */
export async function awardVoiceXp(client: Client<true>): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    if (!settings.get(guild.id, 'modules.levels') || !settings.get(guild.id, 'levels.voice')) {
      continue;
    }
    for (const channel of guild.channels.cache.values()) {
      if (!channel.isVoiceBased() || channel.id === guild.afkChannelId) continue;
      const people = channel.members.filter((member) => !member.user.bot);
      if (people.size < 2) continue;

      for (const member of people.values()) {
        if (member.voice.deaf) continue;
        const gain = levels.awardVoice(guild.id, member.user, 1, {
          channelId: channel.id,
          roleIds: [...member.roles.cache.keys()],
        });
        if (gain) await afterXpGain(member, gain, null);
      }
    }
  }
}
