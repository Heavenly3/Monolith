// Every icon the bot shows, in one place. Standard Unicode emojis render in
// every server with no setup. To use custom art, upload it as an application
// emoji in the Developer Portal and paste its markup here, e.g.
//   coin: '<:coin:123456789012345678>'
import type { SlotSymbol } from '@spacebet/core';

export const emojis = {
  // Brand
  brand: '🚀',
  planet: '🪐',
  galaxy: '🌌',
  star: '🌠',
  sparkle: '✨',
  comet: '💫',
  bot: '🤖',

  // Money
  coin: '🪙',
  wallet: '👛',
  bank: '🏦',
  deposit: '📥',
  withdraw: '📤',
  netWorth: '💎',
  money: '💰',
  payment: '💸',
  card: '💳',
  rank: '🏆',

  // Economy actions
  work: '🛠️',
  collect: '💼',
  wheel: '🛸',
  rob: '🦹',
  busted: '🚨',

  // Loans
  loan: '📝',
  interest: '📈',
  due: '📅',
  bill: '🧾',

  // Games
  slots: '🎰',
  roulette: '🎡',
  horse: '🏇',
  finish: '🏁',
  keno: '🎱',
  raffle: '🎟️',
  ticket: '🎫',
  bet: '🎲',
  win: '🎉',
  lose: '😞',
  jackpot: '💥',
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

  // Shop
  shop: '🛒',
  buy: '🛍️',
  inventory: '🎒',
  role: '🎖️',
  consumable: '🧪',
  permanent: '📦',
  description: '📜',

  // Interface
  config: '⚙️',
  edit: '✏️',
  reset: '↩️',
  help: '📖',
  clock: '⏰',
  previous: '◀️',
  next: '▶️',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  cooldown: '⏳',
} as const;

export type EmojiName = keyof typeof emojis;

/** Slot machine reel faces. The jackpot symbol is set in @spacebet/core (SLOTS). */
export const reelEmojis: Record<SlotSymbol, string> = {
  cherry: '🍒',
  lemon: '🍋',
  grape: '🍇',
  bell: '🔔',
  diamond: '💎',
  seven: '7️⃣',
};
