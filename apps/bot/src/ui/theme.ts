// Visual identity of the bot. Change these to re-skin every message at once.
export const theme = {
  name: 'Monolith',

  colors: {
    // Generic states
    brand: 0x5ec8e5,
    success: 0x58c98a,
    danger: 0xe5534b,
    warning: 0xe8a23c,
    info: 0x5ec8e5,
    gold: 0xf0c04a,
    neutral: 0x3a4048,

    // One accent per feature, so every module has its own look
    economy: 0xe8a23c, // credit amber
    bank: 0x8a96a3, // vault steel
    work: 0xd0763a, // rust
    collect: 0xe8a23c, // power amber
    wheel: 0x9c8cf5, // signal violet
    rob: 0xe5534b, // alarm red
    leaderboard: 0xf0c04a, // podium gold
    slots: 0xe5484d, // machine red
    roulette: 0x9c8cf5, // violet
    horserace: 0x3fb5d6, // conduit cyan
    keno: 0x3cc7b4, // data teal
    raffle: 0xf0a63a, // ticket amber
    loans: 0x6b7785, // concrete grey
    shop: 0x58c98a, // terminal green
    inventory: 0x7a8590, // crate grey
    config: 0x5e6b78, // graphite
    help: 0x4f8fd9, // manual blue
    levels: 0x46d1c2, // elevator teal
  },
} as const;

export type ColorName = keyof typeof theme.colors;
