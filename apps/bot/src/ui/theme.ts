// Visual identity of the bot. Change these to re-skin every message at once.
export const theme = {
  name: 'Mythcore',

  colors: {
    // Generic states
    brand: 0xc9a227,
    success: 0x4caf50,
    danger: 0xb3261e,
    warning: 0xd98e04,
    info: 0x4a7bb7,
    gold: 0xd4a017,
    neutral: 0x5c5248,

    // One accent per feature, so every module has its own look
    economy: 0xc9a227, // coin gold
    bank: 0x8b6914, // treasury bronze
    work: 0x8d6e63, // parchment
    collect: 0xb8860b, // royal gold
    wheel: 0x7e57c2, // arcane violet
    rob: 0x6d1f1f, // bandit blood
    leaderboard: 0xffc107, // crown
    slots: 0xb71c1c, // dragon red
    roulette: 0x5e35b1, // wizard purple
    horserace: 0x1e5aa8, // knightly blue
    keno: 0x00897b, // rune teal
    raffle: 0xe0a106, // herald gold
    loans: 0x5d4037, // moneylender leather
    shop: 0x2e7d32, // market green
    inventory: 0x795548, // leather satchel
    config: 0x7b1fa2, // royal purple
    help: 0x6d4c41, // old tome
  },
} as const;

export type ColorName = keyof typeof theme.colors;
