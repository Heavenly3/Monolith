import type { WheelReward } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { emojis, type EmojiName } from './emojis.ts';
import { coins } from './format.ts';

export { Card, type CardMessage, type CardField } from './card.ts';
export * from './notices.ts';
export * from './format.ts';
export { emojis, reelEmojis, type EmojiName } from './emojis.ts';
export { theme, type ColorName } from './theme.ts';

export type Feature =
  | 'balance'
  | 'bank'
  | 'work'
  | 'collect'
  | 'wheel'
  | 'rob'
  | 'leaderboard'
  | 'slots'
  | 'roulette'
  | 'horserace'
  | 'keno'
  | 'raffle'
  | 'loans'
  | 'shop'
  | 'inventory'
  | 'config'
  | 'help'
  | 'levels';

const FEATURE_ICONS: Record<Feature, EmojiName> = {
  balance: 'wallet',
  bank: 'bank',
  work: 'work',
  collect: 'collect',
  wheel: 'wheel',
  rob: 'rob',
  leaderboard: 'rank',
  slots: 'slots',
  roulette: 'roulette',
  horserace: 'drone',
  keno: 'keno',
  raffle: 'raffle',
  loans: 'loan',
  shop: 'shop',
  inventory: 'inventory',
  config: 'config',
  help: 'help',
  levels: 'level',
};

/** Themed title of a feature, e.g. "🎰 Nebula Slots" or "🎰 Nebula Slots — Results". */
export function featureTitle(t: Translator, feature: Feature, suffix?: string): string {
  const title = `${emojis[FEATURE_ICONS[feature]]} ${t(`features.${feature}`)}`;
  return suffix ? `${title} — ${suffix}` : title;
}

/** Display label of a wheel prize: its custom name, or the amount. */
export function rewardLabel(reward: WheelReward, t: Translator): string {
  if (reward.name) {
    return reward.amount > 0
      ? `**${reward.name}** (${coins(reward.amount)})`
      : `**${reward.name}**`;
  }
  return reward.amount > 0 ? coins(reward.amount) : `**${t('wheel.nothing')}**`;
}
