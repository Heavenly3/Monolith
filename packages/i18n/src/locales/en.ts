const s = (count: number, word: string, plural = `${word}s`): string =>
  `${count} ${count === 1 ? word : plural}`;

export const en = {
  meta: { name: 'English', flag: '🇬🇧' },

  common: {
    wallet: 'Wallet',
    bank: 'Bank',
    netWorth: 'Total',
    yourWallet: 'Your wallet',
    none: 'None',
    by: 'By {user}',
    invalidAmount: 'Enter a valid amount, such as `500`, `2.5k`, `half` or `all`.',
    notEnoughWallet: 'You only have {amount} in your wallet.',
    notEnoughBank: 'You only have {amount} in the bank.',
    emptyWallet: 'Your wallet is empty.',
    emptyBank: 'Your bank is empty.',
    botsNoAccount: 'Bots do not have credits.',
    cooldown: 'You can {action} again {time}.',
    serverOnly: 'Monolith only works inside a server.',
    adminOnly: 'Only administrators can do that.',
    notYours: 'This message belongs to someone else. Use {command} to open your own.',
    error: 'Something went wrong. Please try again. Reference: `{ref}`',
    invalidDuration: 'That is not a valid time. Use formats like `30m`, `12h` or `1d`.',
    moduleDisabled:
      'The **{module}** module is turned off in this server. An administrator can turn it on in {command}.',
  },

  // Name of every module, shown in titles
  features: {
    balance: 'Balance',
    bank: 'Bank',
    work: 'Work',
    collect: 'Role income',
    wheel: 'Wheel of Fortune',
    rob: 'Rob',
    leaderboard: 'Leaderboard',
    slots: 'Slots',
    roulette: 'Roulette',
    horserace: 'Drone race',
    keno: 'Keno',
    raffle: 'Lottery',
    loans: 'Loans',
    shop: 'Shop',
    inventory: 'Inventory',
    config: 'Settings',
    help: 'Help',
    levels: 'Levels',
  },

  modules: {
    economy: 'Economy',
    games: 'Games',
    shop: 'Shop',
    loans: 'Loans',
    lottery: 'Lottery',
    levels: 'Levels',
  },

  levels: {
    announce: '{user} rose to **level {level}**!',
    announceReward: '{user} rose to **level {level}** and earned {role}!',
    announceTitle: 'Level up',
    coins: '+{amount} for levelling up',
    rankSubtitle: 'Experience of {user}',
    level: 'Level',
    rank: 'Rank',
    xp: 'Experience',
    messages: 'Messages',
    voice: 'Voice time',
    progress: '{current} / {needed} XP to level {next}',
    maxLevel: 'Maximum level reached',
    noXp: '{user} has no experience yet. Chat to earn some!',
    nextReward: 'Next reward: {role} at level {level}',
    boardSubtitle: 'The most experienced members of the server.',
    boardEmpty: 'No one has experience yet. Start chatting!',
    boardLine: 'Level {level} · {xp} XP',
    multiplier: 'Multiplier here',
    multiplierParts: 'role {role} · channel {channel}',
    messagesLeft: '≈ {messages} messages to level {level}',
    nextXpIn: 'Next XP {time}',
    nextXpNow: 'Your next message gives XP',
    outOfSync: 'Your reward roles do not match your level.',
    syncButton: 'Fix my roles',
    synced: 'Your reward roles now match your level.',
    calcTitle: 'Level {level}',
    calcTotal: 'Total XP',
    calcMissing: 'Still missing',
    calcMessages: 'Messages',
    calcTime: 'Active chat',
    calcReached: '{user} already reached level {level}.',
    calcFooter: 'Estimated with the average XP per message, the multiplier here and the cooldown.',
    calcMax: 'The maximum level of this server is {max}.',
    menuName: 'View rank',
    disabledHint: 'Levels are turned off in this server.',
  },

  status: 'Wandering the Structure',

  balance: {
    subtitle: 'Credits of {user}',
    rank: 'Rank **#{rank}**',
    activeLoan: 'Active loan',
    loanDue: '{amount} due {time}',
  },

  bank: {
    depositTitle: 'Credits deposited',
    depositBody: 'You moved {amount} into the bank. Thieves cannot touch it there.',
    withdrawTitle: 'Credits withdrawn',
    withdrawBody: 'You moved {amount} from the bank into your wallet.',
  },

  pay: {
    self: 'You cannot pay yourself.',
    bot: 'Bots do not need credits.',
    title: 'Payment sent',
    body: '{sender} gave {amount} to {target}.',
  },

  work: {
    action: 'work',
    noJobs: 'There are no jobs to do. An administrator can add them in {command}.',
    title: 'Work done',
    fallback: '{message} You earned {amount}.',
    next: 'Next job',
    defaultMessages: [
      'You stripped copper from a collapsed conduit on stratum 12 and sold it for {amount}.',
      'You repaired a flickering power relay for a settlement and were paid {amount}.',
      'You mapped an uncharted sector of the Structure and sold the survey for {amount}.',
      'You hauled scrap up three hundred floors of stairwell and earned {amount}.',
      'You recovered a data core from a dead terminal and traded it for {amount}.',
      'You cleared silicon growth from a ventilation shaft and made {amount}.',
      'You escorted a caravan of scavengers through a dark corridor and earned {amount}.',
      'You kept watch on a barricade through the night cycle and were paid {amount}.',
      'You sealed a breach before the coolant flooded the level and received {amount}.',
      'You decoded an old signal from the upper strata and sold the key for {amount}.',
      'You rebuilt a water reclaimer for the residents of block 7 and earned {amount}.',
      'You salvaged parts from a fallen construction drone and made {amount}.',
      'You guided a lost explorer back to the lift shaft and were rewarded {amount}.',
      'You rewired a cargo elevator that had been dead for decades and earned {amount}.',
      'You scavenged a forgotten storage vault and sold the contents for {amount}.',
    ],
  },

  collect: {
    action: 'collect your income',
    noRewards: 'None of your roles give income yet. An administrator can set it up in {command}.',
    title: 'Income collected',
    body: 'Your roles paid you {amount}.',
    next: 'Next income',
  },

  wheel: {
    action: 'spin the wheel',
    empty: 'The wheel has no prizes yet. An administrator can add them in {command}.',
    spinning: 'The wheel is spinning... {label}',
    won: 'The wheel locks on {label}. Lucky signal!',
    lost: 'The wheel stopped on {label}. Better luck next time.',
    nothing: 'Nothing',
    next: 'Next spin',
  },

  rob: {
    self: 'You cannot rob yourself.',
    bot: 'Bots have no wallet to rob.',
    action: 'rob',
    thiefPoor: 'You need at least {amount} in your wallet to pay the fine if you get caught.',
    targetPoor: '{target} has too few credits in their wallet to be worth it.',
    successTitle: 'Robbery successful',
    successBody: 'You slipped out of a maintenance duct and lifted {amount} from {target}.',
    failTitle: 'Caught by a sentinel!',
    failBody: 'A security sentinel caught you in the act. You paid {target} {amount} as a fine.',
    next: 'Next robbery',
  },

  crime: {
    action: 'commit a crime',
    successTitle: 'Clean getaway',
    failTitle: 'Caught!',
    fined: 'You paid a fine of {amount}.',
    next: 'Next crime',
    success: [
      'You siphoned power from a sealed reactor line and sold it on the black market for {amount}.',
      'You forged a stratum transit pass and sold it to a smuggler for {amount}.',
      'You cracked a dormant vault terminal and walked away with {amount}.',
      'You rerouted a cargo lift into your hideout and fenced the crates for {amount}.',
      'You sold fake sentinel codes to a desperate gang for {amount}.',
      'You stripped a parked drone for parts before anyone noticed: {amount}.',
      'You ran an illegal betting ring in the lower vents and kept {amount}.',
      'You hacked a ration dispenser and resold the stock for {amount}.',
      'You smuggled a crate of unregistered chips across sector 9 and earned {amount}.',
      'You looted an abandoned archive and sold the data cores for {amount}.',
      'You counterfeited credit chits and laundered {amount} before the trace caught up.',
      'You picked the lock of a maintenance depot and pawned the tools for {amount}.',
    ],
    fail: [
      'A sentinel scanned your forged pass and flagged it on the spot.',
      'The vault terminal locked down and sealed you in until security arrived.',
      'Your buyer was an undercover enforcer.',
      'The cargo lift jammed halfway and the alarms went off.',
      'A patrol drone recorded your face while you stripped its twin.',
      'Your accomplice talked the moment a sentinel looked at them.',
      'You tripped a pressure plate in the archive and woke every defence system.',
      'The ration dispenser photographed you and sent the picture to the stratum council.',
    ],
  },

  leaderboard: {
    subtitle: 'The richest members of the server (wallet + bank).',
    empty: 'No one has any credits yet. Be the first!',
    you: 'you',
    yourRank: 'Your rank: #{rank}',
  },

  games: {
    action: 'play {game}',
    minWallet: 'You need at least {min} in your wallet to play. You have {wallet}.',
    invalidBet: 'Enter a valid bet, such as `500`, `2.5k`, `half` or `all`.',
    minBet: 'The minimum bet is {min}.',
    maxBet: 'The maximum bet is {max}.',
    won: 'You won {amount}',
    refund: 'You got your bet back',
    lost: 'You lost {amount}',
    bet: 'Bet',
    payout: 'Winnings',
  },

  slots: {
    spinning: 'The reels are spinning...',
    jackpot: 'JACKPOT! THE MONOLITH ALIGNS!',
    triple: 'Three of a kind!',
    pair: 'A pair!',
    none: 'No match',
    paytable: 'Pair ×{pair} · Three of a kind ×{triple} · Three monoliths ×{jackpot}',
  },

  roulette: {
    needsNumber: 'Choose the `number` (0-36) for a single number bet.',
    spinning: 'The wheel is spinning... you bet on **{bet}**.',
    landed: 'The ball landed on {icon} **{number} {color}**',
    win: 'Your bet on **{bet}** wins!',
    lose: 'Your bet on **{bet}** loses.',
    number: 'Number {n}',
    colors: { red: 'red', black: 'black', green: 'green' },
    bets: {
      red: 'Red',
      black: 'Black',
      even: 'Even',
      odd: 'Odd',
      low: 'Low (1-18)',
      high: 'High (19-36)',
      dozen1: '1st dozen (1-12)',
      dozen2: '2nd dozen (13-24)',
      dozen3: '3rd dozen (25-36)',
      column1: '1st column',
      column2: '2nd column',
      column3: '3rd column',
      straight: 'Single number (0-36)',
    },
  },

  horserace: {
    backed: 'You bet on **{horse}**',
    results: 'Results',
    finished: '**{horse}** finished in place **{place}**.',
  },

  keno: {
    badRange: 'Every number must be between 1 and {max}.',
    repeated: 'You cannot choose the same number twice.',
    badCount: 'Choose between 1 and {max} numbers.',
    summary: '**{hits}** of your **{picks}** numbers were drawn.',
    yours: 'Your numbers',
    drawn: 'Numbers drawn ({count})',
    paytable: '{spots} numbers: {table}',
    hits: ({ n }: { n: number }) => s(n, 'match', 'matches'),
  },

  raffle: {
    duplicate: 'You already have ticket {number}.',
    funds: 'A ticket costs {price}. You do not have enough in your wallet.',
    boughtTitle: 'Ticket bought',
    boughtBody: 'You have ticket {number} for {price}.',
    pot: 'Prize',
    draw: 'Draw',
    yourTickets: 'Your tickets',
    announce: 'The winner will be announced in this channel',
    infoSubtitle:
      'Everyone with the winning number shares the prize. No winner? The prize keeps growing!',
    ticketPrice: 'Ticket price',
    sold: 'Tickets sold',
    afterFirst: '{duration} after the first ticket',
    resultsTitle: 'Lottery results',
    winning: 'The winning number is {number}',
    winnerSingle: '{winners} wins the prize of {pot}!',
    winnerSplit: '{winners} share the prize of {pot}! Each one gets {share}.',
    noWinner:
      'No one had the winning number among **{tickets}** tickets.\nThe prize carries over to the next draw: {pot}',
    footer: 'Buy a ticket with {command}',
  },

  loans: {
    statusTitle: 'Your loan',
    statusSubtitle: 'Pay it back before the deadline, or it is taken from you automatically.',
    borrowed: 'Borrowed',
    interest: 'Interest',
    amountDue: 'Amount owed',
    due: 'Deadline',
    repayButton: 'Pay now',
    cannotRepayYet: 'You do not have enough in your wallet to pay yet',
    none: 'You have no loan. You can borrow up to {max} at {rate}% interest.',
    noLoan: 'You have no loan.',
    needToRepay: 'You need {amount} in your wallet to pay. Withdraw from the bank if needed.',
    repaidTitle: 'Loan paid',
    repaidBody: 'You paid back {amount}. You are debt free!',
    already: 'You already have a loan. Pay it back first with {command}.',
    negative: 'You cannot borrow while your balance is negative.',
    range: 'Ask for an amount between 1 and {max}.',
    approvedTitle: 'Loan approved',
    approvedBody: '{amount} was added to your wallet.',
    term: '{time} · term {duration}',
    footer: 'Unpaid loans are taken from your wallet, then your bank',
    notYours: 'That loan is not yours.',
    collectedTitle: 'Your loan was collected',
    collectedBody: 'Your loan reached its deadline.',
    collectedAmount: 'Amount taken',
    debtLeft: 'Still owed',
    debtLeftValue: '{amount} — your wallet is now negative.',
  },

  shop: {
    subtitle: 'Press **Buy** to get one, or use {command} to buy several.',
    empty: 'The shop has nothing for sale yet. Come back soon!',
    consumable: 'Consumable',
    permanent: 'Permanent',
    grants: 'Gives {role}',
    buy: 'Buy',
    items: ({ count }: { count: number }) => s(count, 'item'),
    gone: 'That item is no longer for sale.',
    boughtQuick: 'You bought **{item}** for {amount}.',
    boughtRole: 'You received {role}.',
    walletNow: 'Wallet: {amount}',
    notFound: 'That item is not for sale. See what is with {command}.',
    purchaseTitle: 'Purchase complete',
    purchaseBody: 'You bought **{quantity}× {item}** for {amount}.',
    roleReceived: 'Role received',
    owned: 'In your inventory',
    useHint: 'Use it with {command}',
    alreadyOwned: 'You already have **{item}** — it can only be bought once.',
    cantAfford: 'That costs {total}, but you only have {wallet} in your wallet.',
    refunded: '{reason} Your credits were returned.',
    roleRejected: 'Discord did not let me give the role. Your credits were returned.',
    roleMissing: 'The role linked to this item no longer exists.',
    roleNotEditable: 'I cannot give {role} — move my role above it and give me **Manage Roles**.',
  },

  use: {
    notFound: 'You do not have that item.',
    permanent: '**{item}** is permanent and cannot be used up.',
    roleOne: 'Items that give a role can only be used one at a time.',
    notEnough: 'You only have **{quantity}× {item}**.',
    alreadyHad: 'You already have {role} — the item was not used up.',
    roleRejected: 'Discord did not let me give the role. The item was not used up.',
    title: 'Item used',
    body: 'You used **{quantity}× {item}**.',
    remaining: 'Left in your inventory',
  },

  inventory: {
    subtitle: 'Inventory of {user}',
    empty: 'Empty — visit {command} to buy something.',
    value: 'Worth: {amount}',
  },

  moneyAdmin: {
    add: 'Added {amount} to the {account} of {user}.',
    remove: 'Took {amount} from the {account} of {user}.',
    set: 'Set the {account} of {user} to {amount}.',
    reset: 'Emptied the wallet and bank of {user}.',
    accounts: { wallet: 'wallet', bank: 'bank' },
  },

  incomeAdmin: {
    set: '{role} now gives {amount} of income.',
    removed: '{role} no longer gives income.',
    cleared: ({ count }: { count: number }) => `Removed the income of ${s(count, 'role')}.`,
  },

  wheelAdmin: {
    full: 'The wheel already has the maximum of {max} prizes.',
    added: 'Added {label} to the wheel.',
    missing: 'That prize does not exist.',
    removed: 'Removed {label} from the wheel.',
    reset: 'The wheel was restored to its original prizes.',
  },

  workAdmin: {
    full: 'You can have at most {max} jobs.',
    added: 'Job #{n} added.',
    missing: 'That job does not exist.',
    removed: 'Removed: “{message}”',
    reset: 'Work settings restored to their defaults.',
    noMessages: 'There are no jobs — /work stays closed until you add one.',
    usingDefaults: 'Using the built-in jobs, shown in the language of each reply.',
  },

  shopAdmin: {
    notFound: 'That item does not exist.',
    removed: '**{item}** was removed from the shop.',
    exists: 'An item called **{item}** already exists.',
    badRole: 'Bots cannot give that role.',
    addedBody: '**{item}** is now for sale in the shop.',
    price: 'Price',
    type: 'Type',
    cantAssign: '— I cannot give this role yet',
    description: 'Description',
  },

  loansAdmin: {
    cancelled: 'The loan of {user} was cancelled.',
    none: '{user} has no loan.',
    cancelledAll: ({ count }: { count: number }) => `Cancelled ${s(count, 'loan')}.`,
    listTitle: 'Active loans',
    empty: 'No one has a loan.',
    due: 'due {time}',
  },

  config: {
    subtitle: 'Changes apply instantly. Choose a section below.',
    placeholder: 'Choose a section',
    edit: 'Edit',
    reset: 'Restore defaults',
    saved: 'Settings saved.',
    restored: 'Defaults restored.',
    invalid: 'Invalid value for **{field}** — {hint}.',
    unknown: 'Unknown section.',
    modalTitle: '{category} settings',
    languagePlaceholder: 'Choose the language of the bot',
    languageSaved: 'Language updated.',
    minMax: 'The minimum cannot be greater than the maximum.',
    percentMax: 'A percent cannot be above 100.',
    channelRequired: 'Choose the channel where level-ups are announced.',
    formulaEmpty: 'At least one part of the formula must be above zero.',
    on: 'On',
    off: 'Off',
    notSet: 'Not set',
    builtIn: 'Built-in message',
    hints: {
      coins: 'A whole number, e.g. 2500',
      percent: 'A whole number, e.g. 150 for 150%',
      duration: 'e.g. 30s, 15m, 1h30m, 2d',
      number: 'A whole number',
      decimal: 'A number, decimals allowed, e.g. 0.5',
      language: 'Pick a language',
      toggle: 'Tick to turn on',
      choice: 'Pick one',
      channel: 'Pick a channel (or none)',
      channels: 'Pick one or more channels',
      roles: 'Pick one or more roles',
      template: 'Empty = built-in message. Variables: {variables}',
    },
    choices: {
      curve: {
        gentle: 'Gentle — levels come quickly',
        standard: 'Standard — like most level bots',
        steep: 'Steep — high levels are rare',
        custom: 'Custom — your own formula',
      },
      mode: {
        channel: 'In the channel where they chatted',
        custom: 'In a fixed channel',
        dm: 'By direct message',
        off: 'Do not announce',
      },
      fineMode: {
        fixed: 'Fixed — an amount of credits',
        percent: 'Share of balance — a percent of wallet + bank',
      },
      rewardMode: {
        stack: 'Keep every reward role',
        replace: 'Keep only the highest reward role',
      },
      syncMode: {
        xp: 'Always — fix roles on every XP gain',
        level: 'On level change only',
        never: 'Never — only add roles on level up',
      },
      roleMode: {
        largest: 'Use the largest',
        smallest: 'Use the smallest',
        highest: 'Use the highest role in the list',
        add: 'Add them together',
        multiply: 'Multiply them',
      },
      channelMode: {
        multiply: 'Multiply role × channel',
        add: 'Add role + channel',
        largest: 'Use the largest',
        channel: 'Channel replaces role',
        role: 'Role replaces channel',
      },
      style: {
        card: 'Card — with avatar and title',
        plain: 'Text — a normal message',
      },
    },
    languages: {
      auto: 'Automatic',
      autoDescription: "Each member's Discord language",
      en: 'English',
      es: 'Español',
    },
    categories: {
      general: { label: 'General', description: 'Language of the bot' },
      modules: { label: 'Modules', description: 'Turn whole systems on or off' },
      members: { label: 'Members', description: 'Change the credits of members and see totals' },
      economy: {
        label: 'Economy rules',
        description: 'Starting and maximum balance, bet limits',
      },
      robbery: { label: 'Robbing', description: 'Chance, loot, fine and cooldown of /rob' },
      crime: { label: 'Crime', description: 'Rewards, risk and cooldown of /crime' },
      crimeFine: { label: 'Crime fines', description: 'What a failed /crime costs' },
      work: { label: 'Work', description: 'Rewards, cooldown and jobs of /work' },
      collect: { label: 'Role income', description: 'Income per role and cooldown of /collect' },
      wheel: { label: 'Wheel of Fortune', description: 'Prizes and cooldown of /wheel' },
      games: { label: 'Games', description: 'Cooldowns of the games' },
      shop: { label: 'Shop', description: 'Add or remove items for sale' },
      loans: { label: 'Loans', description: 'Loan terms and active loans' },
      raffle: { label: 'Lottery', description: 'Ticket price, starting prize and draw time' },
      levels: {
        label: 'Experience',
        description: 'XP per message, cooldown and credits per level',
      },
      levelCurve: { label: 'Level curve', description: 'How much XP each level needs' },
      levelFormula: {
        label: 'Custom formula',
        description: 'XP per level for the custom curve, part by part',
      },
      levelMultipliers: {
        label: 'Multiplier rules',
        description: 'How several XP multipliers combine',
      },
      levelRoles: {
        label: 'Reward rules',
        description: 'Whether lower roles stay and when roles are checked',
      },
      levelVoice: { label: 'Voice XP', description: 'Experience for time in voice channels' },
      levelAnnounce: {
        label: 'Level-up messages',
        description: 'Where and how level-ups are announced',
      },
      levelAnnounceRules: {
        label: 'When to announce',
        description: 'Which levels are announced, mentions and style',
      },
      levelLeaderboard: {
        label: 'Public ranking',
        description: 'A ranking page anyone can open, without logging in',
      },
      levelFilters: {
        label: 'Filters',
        description: 'Channels and roles that never earn XP',
      },
      levelRewards: {
        label: 'Role rewards',
        description: 'Roles given when members reach a level',
      },
      levelMembers: {
        label: 'Member XP',
        description: 'Change or reset the experience of members',
      },
    },
    fields: {
      general: {
        language: {
          label: 'Language',
          help: "Language of every reply. Automatic follows each member's Discord language.",
        },
      },
      modules: {
        economy: {
          label: 'Economy',
          help: 'Balance, bank, payments, work, income, wheel and robbing.',
        },
        games: { label: 'Games', help: 'Slots, roulette, race and keno.' },
        shop: { label: 'Shop', help: 'Shop, buying, inventory and using items.' },
        loans: { label: 'Loans', help: 'Borrowing credits with interest.' },
        lottery: { label: 'Lottery', help: 'Numbered tickets and the shared prize.' },
        levels: { label: 'Levels', help: 'Experience for chatting, ranks and role rewards.' },
      },
      levels: {
        min: { label: 'Minimum XP per message', help: 'Least experience a message can give.' },
        max: { label: 'Maximum XP per message', help: 'Most experience a message can give.' },
        cooldown: { label: 'Cooldown', help: 'Time before messages give XP again (stops spam).' },
        coins: { label: 'Credits per level', help: 'Credits paid on every level up (0 = none).' },
      },
      levelCurve: {
        curve: { label: 'Curve', help: 'How fast the XP needed grows from one level to the next.' },
        difficulty: { label: 'Difficulty (%)', help: '100% is normal, 200% needs twice the XP.' },
        maxLevel: { label: 'Maximum level', help: 'Members stop levelling up at this level.' },
      },
      levelFormula: {
        cubic: { label: 'Level³ ×', help: 'Grows very fast at high levels. Usually 0 or below 1.' },
        quadratic: { label: 'Level² ×', help: 'Makes each level a bit harder than the last.' },
        linear: { label: 'Level ×', help: 'Adds the same extra XP on every level.' },
        constant: { label: 'Base XP', help: 'XP every level needs, even level 1.' },
        rounding: {
          label: 'Round to',
          help: 'XP per level is rounded to a multiple of this (1 = exact).',
        },
      },
      levelMultipliers: {
        roleMode: {
          label: 'Several role multipliers',
          help: 'When a member has more than one role with a multiplier.',
        },
        channelMode: {
          label: 'Role and channel',
          help: 'When both a role and the channel (or its category) have a multiplier.',
        },
      },
      levelRoles: {
        rewardMode: { label: 'Reward roles', help: 'Whether members keep lower reward roles.' },
        syncMode: {
          label: 'Role checks',
          help: 'When the bot fixes roles that do not match the level.',
        },
      },
      levelVoice: {
        enabled: {
          label: 'Voice XP',
          help: 'Give experience for time in voice with other people.',
        },
        xp: { label: 'XP per minute', help: 'Experience per minute in a voice channel.' },
      },
      levelAnnounce: {
        mode: { label: 'Where to announce', help: 'Where level-up messages are sent.' },
        channel: {
          label: 'Announcement channel',
          help: 'Used when announcing in a fixed channel.',
        },
        message: { label: 'Message', help: 'Text of the level-up message.' },
      },
      levelAnnounceRules: {
        every: {
          label: 'Announce every',
          help: 'Announce every N levels; reward levels are always announced.',
        },
        until: {
          label: 'Up to level',
          help: 'From this level on, every level is announced again (0 = always every N).',
        },
        rewardsOnly: {
          label: 'Reward levels only',
          help: 'Only announce levels that give a role.',
        },
        ping: { label: 'Mention the member', help: 'The announcement sends them a notification.' },
        style: { label: 'Style', help: 'How the announcement looks in Discord.' },
      },
      levelLeaderboard: {
        public: {
          label: 'Public ranking page',
          help: 'Anyone with the link sees the level ranking of this server on the web.',
        },
      },
      levelFilters: {
        channels: { label: 'Channels without XP', help: 'Messages here never give experience.' },
        roles: {
          label: 'Roles without XP',
          help: 'Members with these roles never earn experience.',
        },
      },
      crime: {
        min: { label: 'Minimum reward', help: 'Least credits a successful /crime pays.' },
        max: { label: 'Maximum reward', help: 'Most credits a successful /crime pays.' },
        failRate: { label: 'Chance of getting caught (%)', help: 'How often /crime fails.' },
        cooldown: { label: 'Cooldown', help: 'Time between two /crime for the same member.' },
      },
      crimeFine: {
        fineMode: { label: 'Fine type', help: 'A fixed amount, or a share of wallet + bank.' },
        min: { label: 'Smallest fine', help: 'In credits, or in percent with "share of balance".' },
        max: { label: 'Largest fine', help: 'In credits, or in percent (up to 100).' },
      },
      work: {
        min: { label: 'Minimum reward', help: 'Least credits /work can pay.' },
        max: { label: 'Maximum reward', help: 'Most credits /work can pay.' },
        cooldown: { label: 'Cooldown', help: 'Time between two /work for the same member.' },
      },
      collect: {
        cooldown: { label: 'Cooldown', help: 'Time between two /collect for the same member.' },
      },
      wheel: {
        cooldown: { label: 'Cooldown', help: 'Time between two spins of /wheel.' },
      },
      games: {
        slots: { label: 'Slots cooldown', help: 'Time between two /slots games.' },
        roulette: { label: 'Roulette cooldown', help: 'Time between two /roulette bets.' },
        horserace: { label: 'Race cooldown', help: 'Time between two /race bets.' },
        keno: { label: 'Keno cooldown', help: 'Time between two /keno games.' },
      },
      economy: {
        start: {
          label: 'Starting balance',
          help: 'Credits every new member gets in their wallet.',
        },
        max: {
          label: 'Maximum balance',
          help: 'Earnings stop when wallet + bank reach this (0 = no limit).',
        },
        minBet: { label: 'Minimum bet', help: 'Smallest bet in every game.' },
        maxBet: { label: 'Maximum bet', help: 'Largest bet in every game (0 = no limit).' },
      },
      robbery: {
        chance: { label: 'Success chance (%)', help: 'How often a robbery works.' },
        steal: {
          label: 'Most stolen (%)',
          help: "Largest share of the victim's wallet a robbery takes.",
        },
        fine: {
          label: 'Largest fine (%)',
          help: "Share of the thief's wallet a failed robbery can cost; it goes to the victim.",
        },
        cooldown: { label: 'Cooldown', help: 'Time between two /rob attempts.' },
      },
      loans: {
        rate: { label: 'Interest (%)', help: 'Extra percentage added to every new loan.' },
        duration: { label: 'Term', help: 'Time before an unpaid loan is collected automatically.' },
        max: { label: 'Maximum loan', help: 'Most credits a member can borrow.' },
      },
      raffle: {
        price: { label: 'Ticket price', help: 'Cost of one lottery ticket.' },
        pot: { label: 'Starting prize', help: 'Prize of a new draw after someone wins.' },
        delay: {
          label: 'Draw time',
          help: 'Time between the first ticket of a round and the draw.',
        },
      },
    },
  },

  levelsAdmin: {
    full: 'You can have at most {max} role rewards.',
    badRole: 'Pick a normal role (not @everyone or a bot role).',
    messagesFull: 'You can have at most {max} level messages.',
    messageSaved: 'Level {level} now has its own message.',
    messageRemoved: 'Level {level} uses the usual message again.',
    missing: 'That reward does not exist.',
    rewardAdded: '{role} is now given at level **{level}**.',
    rewardRemoved: '{role} is no longer a level reward.',
    adjusted: '{user} is now level **{level}** with {xp} XP.',
    resetAll: ({ count }: { count: number }) => `Reset the experience of ${s(count, 'member')}.`,
  },

  panel: {
    more: '…and {count} more',
    modules: {
      hint: 'Press a button to turn a module on or off. Turned-off commands tell members it is disabled.',
      enabled: '**{module}** turned on.',
      disabled: '**{module}** turned off.',
    },
    levels: {
      stats: '{members} members with XP · {xp} XP in total · highest level {top}',
      noRewards: 'No role rewards yet.',
      hint: 'XP multipliers per role and channel are set up in the web dashboard.',
      addReward: 'Add role reward',
      removeReward: 'Remove a role reward…',
      rewardTitle: 'New role reward',
      levelLabel: 'Level',
      roleLabel: 'Role',
      messagesTitle: 'Level messages',
      noMessages: 'No special messages: every level uses the usual one.',
      addMessage: 'Level message',
      removeMessage: 'Remove a level message…',
      messageTitle: 'Message for one level',
      messageLabel: 'Message',
      messageLevelHint: 'The level that shows this message instead of the usual one (1–1000)',
      preview: 'Preview',
      previewTitle: 'This is how level {level} would be announced for you:',
      keepLabel: 'Keep when replaced',
      keepHint: 'With "only the highest role", members still keep this one.',
      noSyncLabel: 'Give once',
      noSyncHint: 'Given on reaching the level; never added back or removed.',
      keepFlag: 'kept',
      noSyncFlag: 'given once',
      adjust: 'Change member XP',
      adjustTitle: 'Change the experience of a member',
      member: 'Member',
      action: 'Action',
      actions: {
        add: 'Add XP',
        remove: 'Remove XP',
        setXp: 'Set exact XP',
        setLevel: 'Set level',
        reset: 'Reset to zero',
      },
      amount: 'Amount',
      amountHint: 'XP, or the level for "Set level". Not needed to reset.',
      resetAll: 'Reset all XP',
      confirmResetAll:
        'This removes the experience of every member. Reward roles stay until they chat again.',
    },
    confirm: 'Confirm',
    cancel: 'Cancel',
    cancelled: 'Cancelled.',
    clearAll: 'Remove all',
    economy: {
      stats: '{accounts} members with credits · {total} in total',
      resetAll: 'Reset the economy',
      confirmResetAll:
        'Empty **every wallet and bank** of the server? Loans, items and history are kept. This cannot be undone.',
      resetDone: 'Economy reset: {count} members back to zero.',
    },
    members: {
      adjust: 'Change credits',
      accounts: 'Members with credits',
      inWallets: 'Credits in wallets',
      inBanks: 'Credits in banks',
      hint: 'Add, remove or set the credits of any member, or reset them completely.',
      modalTitle: 'Change credits',
      member: 'Member',
      action: 'Action',
      actions: {
        add: 'Add credits',
        remove: 'Remove credits',
        set: 'Set exact amount',
        reset: 'Reset everything',
      },
      account: 'Where',
      amount: 'Amount',
      amountHint: 'Not needed to reset everything',
      amountRequired: 'Enter an amount for that action.',
    },
    work: {
      messages: 'Jobs',
      add: 'Add job',
      removePlaceholder: 'Remove a job…',
      modalTitle: 'New job',
      messageLabel: 'Job message',
      messageHint:
        'The reward is added at the end. Optional: write {amount} to place it elsewhere.',
      confirmReset: 'This restores the rewards, the cooldown and the built-in jobs.',
    },
    collect: {
      roles: 'Roles with income',
      empty: 'No role gives income yet.',
      add: 'Set role income',
      removePlaceholder: 'Remove the income of a role…',
      modalTitle: 'Role income',
      roleLabel: 'Role',
      amountLabel: 'Credits per collect',
      confirmClear: 'This removes the income of every role.',
    },
    wheel: {
      prizes: 'Prizes',
      empty: 'The wheel has no prizes.',
      add: 'Add prize',
      resetPrizes: 'Restore prizes',
      removePlaceholder: 'Remove a prize…',
      modalTitle: 'New prize',
      amountLabel: 'Credits (0 = empty slot)',
      labelLabel: 'Custom name (optional)',
      confirmReset: 'This replaces every prize with the original ones.',
    },
    shop: {
      items: 'Items for sale',
      add: 'Add item',
      removePlaceholder: 'Remove an item…',
      hint: 'Permanent items with a role give it when bought; consumables give it when used.',
      modalTitle: 'New item',
      name: 'Name',
      nameRequired: 'The item needs a name.',
      typeHint: 'Consumables are used up with /use',
      role: 'Role (optional)',
      roleHint: 'Given on purchase (permanent) or on use (consumable)',
      confirmRemove: 'Remove **{item}** from the shop? It also disappears from every inventory.',
    },
    loans: {
      cancelAll: 'Cancel all',
      cancelPlaceholder: 'Cancel the loan of…',
      confirmCancelAll: 'This cancels every active loan.',
    },
    raffle: {
      round: 'Current draw',
      waiting: 'Waiting for the first ticket',
    },
  },

  help: {
    subtitle: 'Everything you need to know: commands, games and settings.',
    placeholder: 'Open a section',
    commandPlaceholder: 'Open a command',
    unknownCommand: 'There is no command called `{name}`.',
    usage: 'Usage',
    options: 'Options',
    optional: 'optional',
    cooldown: 'Cooldown',
    adminOnly: 'Administrators only',
    configuredIn: 'Set in {command}',
    currentValue: 'Current value',
    commandsTitle: 'Commands',
    tip: 'Tip: use `/help command:<name>` to open one command directly.',
    home: {
      intro:
        'Welcome to Monolith, an economy and levels bot set inside an endless megastructure. Work the strata to earn credits, keep them safe in the bank, try your luck in the games and spend them in the shop.',
      quickStart: 'Your first steps',
      steps: [
        '{work} to earn your first credits',
        '{deposit} to keep it safe from thieves',
        '{slots} or another game to multiply it',
        '{shop} to spend it',
      ],
      amounts: 'Amounts accept `500`, `1,500`, `2.5k`, `1m`, `half` or `all`.',
    },
    sections: {
      economy: {
        label: 'Economy',
        description: 'Earn, save and send credits',
        intro:
          'Your credits are kept in two places: the **wallet** (ready to spend, but others can rob it) and the **bank** (safe from robberies). Games, payments and the shop always use the wallet.',
      },
      games: {
        label: 'Games',
        description: 'Games, payouts and the lottery',
        intro:
          'Every game takes your bet from the wallet and pays your bet times the multiplier (×2 gives back double your bet). The minimum bet is {min}.',
        payouts: 'Payouts',
      },
      loans: {
        label: 'Loans',
        description: 'Borrow credits and pay them back',
        intro:
          'Borrow credits now and pay them back with interest. If the loan reaches its deadline, it is taken automatically: first from your wallet, then from your bank, and whatever is missing leaves your wallet negative.',
      },
      shop: {
        label: 'Shop',
        description: 'Items, roles and your inventory',
        intro:
          '**Permanent** items stay in your inventory; if they give a role you get it right away and can only buy them once. **Consumable** items are used up with /use and can give a role when used.',
      },
      levels: {
        label: 'Levels',
        description: 'Experience, ranks and role rewards',
        intro:
          'Members earn experience (XP) for chatting — once per cooldown so spam does not count — and optionally for time in voice. Enough XP raises your level; some levels give a role or credits.',
      },
      admin: {
        label: 'Administration',
        description: 'The settings panel',
        intro:
          'Everything is set up from {command}: language, members’ credits, work, role income, the Wheel of Fortune, game cooldowns, the shop, loans and the lottery. Only administrators see it — you can allow other roles in Server Settings → Integrations.',
      },
      config: {
        label: 'Settings',
        description: 'Every setting and its current value',
        intro: 'All of these can be changed instantly from {command}.',
      },
    },
    payouts: {
      slots: 'Pair ×{pair} · Three of a kind ×{triple} · Three monoliths ×{jackpot}',
      roulette: 'Colour, even/odd, low/high ×2 · Dozen or column ×3 · Single number ×36',
      horserace: '1st ×{first} · 2nd ×{second} · 3rd ×{third}',
      keno: 'Pick 1-10 numbers; 20 of 80 are drawn. More matches pay more — up to ×{max}.',
    },
    commands: {
      balance: {
        about:
          'Shows the wallet, bank, total and leaderboard rank of you or another member, plus any active loan.',
      },
      deposit: {
        about:
          'Moves credits from your wallet into the bank. Credits in the bank cannot be stolen with /rob.',
      },
      withdraw: {
        about: 'Moves credits from the bank back into your wallet so you can spend them.',
      },
      pay: { about: 'Gives credits from your wallet to another member instantly.' },
      crime: {
        about:
          'Try something illegal for a bigger payout than /work. It can fail: then you pay a fine, fixed or a share of your balance. There is a cooldown between crimes.',
      },
      work: {
        about:
          'Do a job somewhere in the Structure (salvage, repairs, surveys…) and earn a random reward within the configured range. There is a cooldown between jobs.',
      },
      collect: {
        about:
          'Collects the income of every role you have that an administrator set up in /config. The income of all your roles adds up.',
      },
      wheel: {
        about:
          'Spins the Wheel of Fortune for a free prize. Every slot has the same chance, and some are empty.',
      },
      rob: {
        about:
          'Tries to steal part of another member’s wallet. If a sentinel catches you, you pay a fine to that member. You need some credits yourself, and the target must have enough in their wallet.',
      },
      leaderboard: {
        about: 'Ranks the server by total credits (wallet + bank), 10 members per page.',
      },
      slots: {
        about:
          'A slot machine with three reels. A pair or three of a kind pay out, and three monoliths win the jackpot.',
      },
      roulette: {
        about:
          'Bet on a colour, even or odd, low or high, a dozen, a column or a single number. The ball lands on 0-36; 0 is green and only wins single number bets.',
      },
      race: {
        about:
          'Bet on one of 10 drones racing through a service conduit. You win if your drone finishes in the top 3, and you can watch the race live.',
      },
      keno: {
        about:
          'Pick 1-10 numbers from 1 to 80 (or let the bot pick them). 20 numbers are drawn; your winnings depend on how many you picked and how many match.',
      },
      lottery: {
        about:
          'Buy tickets numbered 000 to 999. The draw happens some time after the first ticket of a round; everyone with the winning number shares the prize, otherwise it carries over and keeps growing.',
      },
      loan: {
        about:
          'Borrow credits, check your loan or pay it back. You can only have one loan at a time, and the interest is added when you borrow.',
      },
      shop: { about: 'Browse the items for sale, 5 per page, with a Buy button on each one.' },
      buy: { about: 'Buys one or more of an item. Start typing to search the shop.' },
      use: {
        about:
          'Uses consumable items from your inventory. If the item gives a role, you receive it.',
      },
      inventory: {
        about: 'Lists the items you (or another member) own and their total worth.',
      },
      help: { about: 'Opens this guide.' },
      rank: {
        about:
          'Shows the level, progress to the next level, rank, total experience, messages and voice time of you or another member, plus the next role reward.',
      },
      calculate: {
        about:
          'Calculates the total XP a level needs, how much you (or another member) still miss, and about how many messages and how much chat that takes.',
      },
      levels: { about: 'Ranks the server by experience, 10 members per page.' },
      config: {
        about:
          'Opens the settings panel: language, members’ credits, work, role income, the Wheel of Fortune, game cooldowns, shop items, loans and the lottery — all with buttons, menus and forms. Destructive actions ask for confirmation.',
      },
    },
  },
};

export type Messages = typeof en;
