// The custom icon set: which game-icons.net icon and colour each emoji uses.
// Icons by Lorc, Delapouite, Skoll, Caro Asercion and Sbed, from
// https://game-icons.net — licensed under CC BY 3.0.
// `npm run emojis` renders them and uploads them as application emojis.
import type { SlotSymbol } from '@mythcore/core';
import type { EmojiName } from './emojis.ts';

const GOLD = '#e8b64c';
const SILVER = '#cfd6df';
const BRONZE = '#cd7f32';
const RED = '#e05a4f';
const GREEN = '#62c46a';
const BLUE = '#6aa7e0';
const PURPLE = '#b088e0';
const BROWN = '#c99560';
const ORANGE = '#ef8a3c';
const TEAL = '#4fc0b4';

export interface IconSpec {
  /** Path inside the game-icons repository, without .svg */
  icon: string;
  color: string;
}

/** Emojis without an entry keep their Unicode fallback (e.g. roulette colours). */
export const ICONS: Partial<Record<EmojiName, IconSpec>> & Record<`reel_${SlotSymbol}`, IconSpec> =
  {
    crest: { icon: 'delapouite/knight-banner', color: GOLD },
    castle: { icon: 'lorc/castle', color: SILVER },
    realm: { icon: 'caro-asercion/heraldic-sun', color: GOLD },
    candle: { icon: 'lorc/candle-flame', color: ORANGE },
    sparkle: { icon: 'delapouite/sparkles', color: GOLD },
    wisp: { icon: 'lorc/moon', color: SILVER },
    bot: { icon: 'delapouite/robot-helmet', color: SILVER },

    coin: { icon: 'delapouite/two-coins', color: GOLD },
    wallet: { icon: 'lorc/shiny-purse', color: BROWN },
    bank: { icon: 'skoll/open-treasure-chest', color: GOLD },
    deposit: { icon: 'lorc/locked-chest', color: GOLD },
    withdraw: { icon: 'skoll/open-chest', color: GOLD },
    netWorth: { icon: 'lorc/gems', color: TEAL },
    money: { icon: 'delapouite/coins-pile', color: GOLD },
    payment: { icon: 'lorc/swap-bag', color: GOLD },
    card: { icon: 'lorc/wax-seal', color: RED },
    rank: { icon: 'lorc/trophy', color: GOLD },

    work: { icon: 'lorc/scroll-unfurled', color: BROWN },
    collect: { icon: 'lorc/crown-coin', color: GOLD },
    wheel: { icon: 'caro-asercion/tarot-10-wheel-of-fortune', color: PURPLE },
    rob: { icon: 'delapouite/robber-mask', color: RED },
    busted: { icon: 'lorc/handcuffs', color: SILVER },

    loan: { icon: 'delapouite/scroll-quill', color: BROWN },
    interest: { icon: 'lorc/scales', color: SILVER },
    due: { icon: 'delapouite/calendar', color: ORANGE },
    bill: { icon: 'lorc/quill-ink', color: SILVER },

    slots: { icon: 'lorc/dragon-head', color: RED },
    roulette: { icon: 'lorc/crystal-ball', color: PURPLE },
    horse: { icon: 'skoll/mounted-knight', color: SILVER },
    finish: { icon: 'delapouite/checkered-flag', color: SILVER },
    keno: { icon: 'lorc/rune-stone', color: TEAL },
    raffle: { icon: 'delapouite/ticket', color: GOLD },
    ticket: { icon: 'delapouite/ticket', color: GOLD },
    bet: { icon: 'delapouite/dice-six-faces-five', color: SILVER },
    win: { icon: 'delapouite/laurels-trophy', color: GOLD },
    lose: { icon: 'lorc/broken-skull', color: SILVER },
    jackpot: { icon: 'lorc/dragon-breath', color: ORANGE },
    up: { icon: 'delapouite/thumb-up', color: GREEN },
    down: { icon: 'delapouite/thumb-down', color: RED },
    refund: { icon: 'lorc/return-arrow', color: BLUE },
    marker: { icon: 'delapouite/round-star', color: GOLD },
    spinning: { icon: 'lorc/cycle', color: PURPLE },
    first: { icon: 'lorc/medal', color: GOLD },
    second: { icon: 'lorc/medal', color: SILVER },
    third: { icon: 'lorc/medal', color: BRONZE },

    shop: { icon: 'delapouite/shop', color: BROWN },
    buy: { icon: 'delapouite/coins', color: GOLD },
    inventory: { icon: 'delapouite/backpack', color: BROWN },
    role: { icon: 'delapouite/imperial-crown', color: GOLD },
    consumable: { icon: 'delapouite/health-potion', color: RED },
    permanent: { icon: 'delapouite/griffin-shield', color: SILVER },
    description: { icon: 'lorc/tied-scroll', color: BROWN },

    config: { icon: 'delapouite/throne-king', color: GOLD },
    edit: { icon: 'lorc/quill', color: SILVER },
    reset: { icon: 'lorc/recycle', color: BLUE },
    help: { icon: 'delapouite/spell-book', color: PURPLE },
    clock: { icon: 'lorc/hourglass', color: SILVER },
    cooldown: { icon: 'lorc/empty-hourglass', color: ORANGE },
    success: { icon: 'delapouite/check-mark', color: GREEN },
    error: { icon: 'sbed/cancel', color: RED },
    warning: { icon: 'lorc/hazard-sign', color: ORANGE },
    info: { icon: 'delapouite/info', color: BLUE },

    reel_sword: { icon: 'lorc/broadsword', color: SILVER },
    reel_shield: { icon: 'delapouite/cross-shield', color: BLUE },
    reel_ale: { icon: 'lorc/beer-stein', color: ORANGE },
    reel_crown: { icon: 'delapouite/jewel-crown', color: GOLD },
    reel_gem: { icon: 'delapouite/fire-gem', color: TEAL },
    reel_dragon: { icon: 'lorc/dragon-head', color: RED },
  };

/** Background tile of every icon (dark leather), readable on light and dark themes. */
export const ICON_TILE = { fill: '#2a211b', radius: 104 };
