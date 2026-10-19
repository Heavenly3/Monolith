// Every icon the bot shows, in one place.
//
// The values below are standard Unicode fallbacks that work everywhere. When
// the custom icon set is uploaded (`npm run emojis`, see ./icons.ts), the bot
// loads those application emojis at startup and uses them instead — every
// `emojis.<name>` lookup returns the custom one automatically.
import type { SlotSymbol } from '@mythcore/core';

const FALLBACK = {
  // Realm
  crest: '⚜️',
  castle: '🏰',
  realm: '🗺️',
  candle: '🕯️',
  sparkle: '✨',
  wisp: '🌫️',
  bot: '🗿',

  // Gold
  coin: '🪙',
  wallet: '👝',
  bank: '🗝️',
  deposit: '🔒',
  withdraw: '🔓',
  netWorth: '💎',
  money: '💰',
  payment: '🤝',
  card: '✍️',
  rank: '🏆',

  // Deeds
  work: '📜',
  collect: '👑',
  wheel: '🎡',
  rob: '🗡️',
  busted: '⛓️',

  // Moneylender
  loan: '📃',
  interest: '⚖️',
  due: '📅',
  bill: '🪶',

  // Tavern games
  slots: '🐉',
  roulette: '🔮',
  horse: '🏇',
  finish: '🏁',
  keno: '🪨',
  raffle: '🎟️',
  ticket: '🎫',
  bet: '🎲',
  win: '🎉',
  lose: '💀',
  jackpot: '🔥',
  up: '📈',
  down: '📉',
  refund: '↩️',
  marker: '⭐',
  spinning: '🌀',
  red: '🔴',
  black: '⚫',
  green: '🟢',
  first: '🥇',
  second: '🥈',
  third: '🥉',

  // Market
  shop: '🏪',
  buy: '🧺',
  inventory: '🎒',
  role: '🛡️',
  consumable: '🧪',
  permanent: '⚔️',
  description: '📜',

  // Interface
  config: '🏰',
  edit: '🪶',
  reset: '🔄',
  help: '📖',
  clock: '⌛',
  cooldown: '⏳',
  previous: '◀️',
  next: '▶️',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
} as const;

export type EmojiName = keyof typeof FALLBACK;

/** Faces of the Dragon's Hoard reels (the jackpot symbol lives in @mythcore/core). */
const REEL_FALLBACK: Record<SlotSymbol, string> = {
  sword: '🗡️',
  shield: '🛡️',
  ale: '🍺',
  crown: '👑',
  gem: '💎',
  dragon: '🐉',
};

/** Application emojis are named `mc_<name>` (reels: `mc_reel_<symbol>`). */
export const EMOJI_PREFIX = 'mc_';

const custom = new Map<string, string>();

function withOverrides<T extends Record<string, string>>(fallback: T, prefix: string): Readonly<T> {
  return new Proxy(fallback, {
    get: (target, key) =>
      typeof key === 'string' ? (custom.get(prefix + key) ?? target[key as keyof T]) : undefined,
  });
}

export const emojis = withOverrides(FALLBACK, '');
export const reelEmojis = withOverrides(REEL_FALLBACK, 'reel_');

/**
 * Uses the uploaded icon set. Call it with the bot's application emojis;
 * returns how many icons were found.
 */
export function registerApplicationEmojis(
  list: Iterable<{ id: string; name: string | null; animated: boolean | null }>,
): number {
  custom.clear();
  for (const emoji of list) {
    if (!emoji.name?.startsWith(EMOJI_PREFIX)) continue;
    const key = emoji.name.slice(EMOJI_PREFIX.length);
    custom.set(key, `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`);
  }
  return custom.size;
}

/** Every icon name, used by the upload script. */
export const EMOJI_NAMES = Object.keys(FALLBACK) as EmojiName[];
