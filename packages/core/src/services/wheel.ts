import * as settings from './settings.ts';
import type { WheelReward } from '../config/defaults.ts';

export const MAX_REWARDS = 25;

export function getRewards(guildId: string): WheelReward[] {
  return settings.get(guildId, 'wheel.rewards');
}

export function addReward(guildId: string, reward: WheelReward): 'ok' | 'full' {
  const rewards = getRewards(guildId);
  if (rewards.length >= MAX_REWARDS) return 'full';
  settings.set(guildId, 'wheel.rewards', [...rewards, reward]);
  return 'ok';
}

/** Removes the slot at `index` and returns it (null when it does not exist). */
export function removeReward(guildId: string, index: number): WheelReward | null {
  const rewards = getRewards(guildId);
  const [removed] = rewards.splice(index, 1);
  if (!removed) return null;
  settings.set(guildId, 'wheel.rewards', rewards);
  return removed;
}

export function resetRewards(guildId: string): void {
  settings.reset(guildId, 'wheel.rewards');
}
