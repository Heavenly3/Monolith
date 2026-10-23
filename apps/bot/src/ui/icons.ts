// The custom icon set: which Tabler icon (https://tabler.io/icons, MIT) and
// colour each emoji uses. Names are outline icons; "filled/<name>" uses the
// filled variant. `npm run emojis` renders them on a graphite tile and uploads
// them as application emojis.
import type { SlotSymbol } from '@monolith/core';
import type { EmojiName } from './emojis.ts';

const CYAN = '#5ec8e5';
const AMBER = '#e8a23c';
const STEEL = '#b6c0ca';
const RUST = '#d0763a';
const RED = '#e5534b';
const GREEN = '#58c98a';
const VIOLET = '#9c8cf5';
const TEAL = '#3cc7b4';
const GOLD = '#f0c04a';
const SILVER = '#d5dbe1';
const BRONZE = '#c9824a';

export interface IconSpec {
  /** Tabler icon name ("cpu", "filled/star") or one drawn for Monolith ("custom/monolith"). */
  icon: string;
  color: string;
}

/** Emojis without an entry keep their Unicode fallback (e.g. roulette colours). */
export const ICONS: Partial<Record<EmojiName, IconSpec>> & Record<`reel_${SlotSymbol}`, IconSpec> =
  {
    logo: { icon: 'custom/monolith', color: CYAN },
    structure: { icon: 'building-skyscraper', color: STEEL },
    sector: { icon: 'grid-dots', color: CYAN },
    signal: { icon: 'antenna', color: AMBER },
    sparkle: { icon: 'sparkles', color: CYAN },
    static: { icon: 'scan', color: STEEL },
    bot: { icon: 'robot', color: STEEL },

    coin: { icon: 'coin', color: AMBER },
    wallet: { icon: 'wallet', color: AMBER },
    bank: { icon: 'vault', color: STEEL },
    deposit: { icon: 'lock', color: CYAN },
    withdraw: { icon: 'lock-open', color: AMBER },
    netWorth: { icon: 'diamond', color: CYAN },
    money: { icon: 'coins', color: AMBER },
    payment: { icon: 'arrows-exchange', color: CYAN },
    card: { icon: 'id', color: STEEL },
    rank: { icon: 'trophy', color: GOLD },
    level: { icon: 'elevator', color: CYAN },
    xp: { icon: 'bolt', color: CYAN },
    message: { icon: 'message-circle', color: STEEL },
    voice: { icon: 'microphone', color: CYAN },
    levelUp: { icon: 'stairs-up', color: GREEN },
    modules: { icon: 'puzzle', color: STEEL },

    work: { icon: 'tool', color: RUST },
    collect: { icon: 'plug-connected', color: AMBER },
    wheel: { icon: 'settings', color: VIOLET },
    rob: { icon: 'mask', color: RED },
    busted: { icon: 'alarm', color: RED },

    loan: { icon: 'cash', color: STEEL },
    interest: { icon: 'gauge', color: AMBER },
    due: { icon: 'calendar-due', color: RUST },
    bill: { icon: 'receipt', color: STEEL },

    slots: { icon: 'cherry', color: RED },
    roulette: { icon: 'roulette', color: VIOLET },
    drone: { icon: 'drone', color: CYAN },
    finish: { icon: 'flag-3', color: SILVER },
    keno: { icon: 'grid-dots', color: TEAL },
    raffle: { icon: 'ticket', color: AMBER },
    ticket: { icon: 'ticket', color: AMBER },
    bet: { icon: 'poker-chip', color: STEEL },
    win: { icon: 'podium', color: GOLD },
    lose: { icon: 'skull', color: STEEL },
    jackpot: { icon: 'radioactive', color: AMBER },
    up: { icon: 'thumb-up', color: GREEN },
    down: { icon: 'thumb-down', color: RED },
    refund: { icon: 'arrow-back-up', color: CYAN },
    marker: { icon: 'star', color: GOLD },
    spinning: { icon: 'refresh', color: VIOLET },
    first: { icon: 'medal', color: GOLD },
    second: { icon: 'medal', color: SILVER },
    third: { icon: 'medal', color: BRONZE },

    shop: { icon: 'building-store', color: GREEN },
    buy: { icon: 'shopping-cart', color: AMBER },
    inventory: { icon: 'package', color: STEEL },
    role: { icon: 'badge', color: CYAN },
    consumable: { icon: 'flask-2', color: GREEN },
    permanent: { icon: 'shield-check', color: STEEL },
    description: { icon: 'file-description', color: STEEL },

    config: { icon: 'adjustments-horizontal', color: CYAN },
    edit: { icon: 'pencil', color: STEEL },
    reset: { icon: 'refresh', color: CYAN },
    help: { icon: 'book-2', color: CYAN },
    clock: { icon: 'hourglass-high', color: STEEL },
    cooldown: { icon: 'hourglass-empty', color: RUST },
    success: { icon: 'circle-check', color: GREEN },
    error: { icon: 'circle-x', color: RED },
    warning: { icon: 'alert-triangle', color: AMBER },
    info: { icon: 'info-circle', color: CYAN },

    reel_nut: { icon: 'nut', color: STEEL },
    reel_gear: { icon: 'settings', color: RUST },
    reel_chip: { icon: 'cpu', color: CYAN },
    reel_cell: { icon: 'battery-4', color: GREEN },
    reel_core: { icon: 'atom', color: VIOLET },
    reel_monolith: { icon: 'custom/monolith', color: AMBER },
  };

/** Tile behind every icon: graphite panel with a thin edge, readable on light and dark themes. */
export const ICON_TILE = { fill: '#15181c', edge: '#2c333b', radius: 22 };
