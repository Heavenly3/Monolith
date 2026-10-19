# 🚀 SpaceBet

**SpaceBet** is a space-themed economy and casino bot for Discord. Members earn coins, bank them, gamble them across four casino games, take loans, join a jackpot raffle and spend their fortune in a role shop — all through modern slash commands and Discord's **Components V2** message layout. Every server has its own economy.

![CI](https://github.com/Heavenly3/SpaceBet/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%E2%89%A522.18-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![discord.js](https://img.shields.io/badge/discord.js-v14.27-5865F2?logo=discord&logoColor=white)

---

## 📑 Contents

- [Features](#-features)
- [Commands](#-commands)
- [Quick start](#%EF%B8%8F-quick-start)
- [Configuration](#-configuration)
- [Architecture](#%EF%B8%8F-architecture)
- [Development](#-development)
- [Upgrading](#%EF%B8%8F-upgrading)
- [License](#-license)

---

## ✨ Features

- **One economy per server** — balances, shop, settings and leaderboards are separate in every server the bot joins.
- **Components V2 interface** — every reply is a container with sections, avatars, dividers and inline buttons. Each feature has its own colour, icon and space-themed name (Stellar Bank, Nebula Slots, Orbital Roulette...).
- **English and Spanish** — replies follow each member's Discord language, or a language forced by the admins. Slash command descriptions and options are translated in the Discord client too.
- **Mission Control panel (`/config`)** — manage the whole bot without typing commands: language, member balances, work pay and job messages, role income, wheel prizes, game cooldowns, shop items, loans and the raffle. Destructive actions ask for confirmation, and every change is recorded in an audit log.
- **Built-in guide** — `/help` explains every command, option, game payout and setting, with live values and clickable commands.
- **Fair casino games** — slots, roulette, horse racing and keno with animations, cryptographically secure randomness and a house edge verified by tests, so nobody can farm infinite money.
- **Transaction ledger** — every coin that moves is recorded with its reason and resulting balance.
- **Loans, raffle and role shop** — loans with interest collected automatically when overdue, a jackpot raffle that rolls over, and permanent or consumable items that can grant roles.
- **Nothing to compile** — written in strict TypeScript that Node runs directly, with data in Node's built-in SQLite.

---

## 🎮 Commands

Amounts accept `500`, `1,500`, `2.5k`, `1m`, `half`/`mitad` or `all`/`todo`. Run `/help` in Discord for the full guide, or `/help command:<name>` for one command.

| Category   | Commands                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------- |
| 💰 Economy | `/balance` `/deposit` `/withdraw` `/pay` `/work` `/income` `/wheel` `/rob` `/leaderboard` |
| 🎰 Games   | `/slots` `/roulette` `/race` `/keno` `/raffle buy` `/raffle info`                         |
| 🏦 Loans   | `/loan request` `/loan status` `/loan repay`                                              |
| 🛒 Shop    | `/shop` `/buy` `/use` `/inventory`                                                        |
| ⚙️ Admin   | `/config` (Mission Control panel)                                                         |
| 📖 General | `/help`                                                                                   |

`/config` is hidden from members without the **Administrator** permission. You can grant it to other roles in **Server Settings → Integrations → SpaceBet**.

### Payouts

All games return the stake multiplied by the number shown (stake included).

| Game          | Payouts                                                              |
| ------------- | -------------------------------------------------------------------- |
| 🎰 Slots      | Pair ×1.5 · Three of a kind ×10 · Three sevens ×25                   |
| 🎡 Roulette   | Colour / even / odd / low / high ×2 · Dozen / column ×3 · Number ×36 |
| 🏇 Horse race | 1st ×6 · 2nd ×2 · 3rd ×1 (bet back)                                  |
| 🎱 Keno       | Depends on how many numbers you pick (1–10) and how many are drawn   |

Rules and paytables live in [packages/core/src/config/games.ts](packages/core/src/config/games.ts).

---

## ⚙️ Quick start

**Requirements:** [Node.js 22.18 or newer](https://nodejs.org/) (Node 24 LTS recommended).

1. **Clone and install**

   ```bash
   git clone https://github.com/Heavenly3/SpaceBet.git
   cd SpaceBet
   npm install
   ```

2. **Create the bot** in the [Discord Developer Portal](https://discord.com/developers/applications), copy its token and application ID, and invite it with the `bot` and `applications.commands` scopes and the **Manage Roles** permission (needed for shop roles).

3. **Configure the environment**

   ```bash
   cp .env.example .env
   ```

   | Variable        | Required | Description                                                            |
   | --------------- | -------- | ---------------------------------------------------------------------- |
   | `TOKEN`         | ✅       | Bot token.                                                             |
   | `CLIENT_ID`     | ✅       | Application ID.                                                        |
   | `GUILD_ID`      |          | Server ID for instant command updates. Leave empty to deploy globally. |
   | `DATABASE_PATH` |          | SQLite file location. Default: `storage/spacebet.db`.                  |
   | `LOG_LEVEL`     |          | `debug`, `info`, `warn` or `error`. Default: `info`.                   |

4. **Register the slash commands and start the bot**

   ```bash
   npm run deploy
   npm start
   ```

   Optionally add starter items to a server's shop with `npm run seed:shop -- <serverId>`.

---

## 🔧 Configuration

- **In Discord:** everything is managed from the `/config` panel, per server. _General → Language_ chooses between automatic (each member's Discord language), English or Spanish.
- **Defaults:** [packages/core/src/config/defaults.ts](packages/core/src/config/defaults.ts) holds the starting value of every setting.
- **Look and feel:** [apps/bot/src/ui/theme.ts](apps/bot/src/ui/theme.ts) (name and colours) and [apps/bot/src/ui/emojis.ts](apps/bot/src/ui/emojis.ts) (every icon).

> **Custom emojis:** standard Unicode emojis are used so the bot looks right everywhere. To use your own art, upload it as **application emojis** in the Developer Portal and paste the markup into `emojis.ts`.

---

## 🏗️ Architecture

SpaceBet is a monorepo (npm workspaces) so the bot and a future web dashboard share the same rules and data.

```
packages/
├── i18n/            @spacebet/i18n — English and Spanish texts, pure TypeScript
└── core/            @spacebet/core — database, migrations and domain logic, no Discord code
    └── src/
        ├── db/          SQLite connection and versioned migrations
        ├── services/    accounts, ledger, settings, shop, loans, raffle, rob, audit...
        ├── games/       pure game rules and the betting flow
        └── config/      defaults, game tables and the settings schema
apps/
└── bot/             @spacebet/bot — the Discord bot
    └── src/
        ├── commands/    one file per slash command, grouped by category
        ├── panels/      the /config panel, one file per section
        ├── framework/   command loader, router context, mentions
        ├── events/      ready and interactionCreate (the router)
        ├── jobs/        loan collection, raffle draws, cleanup
        ├── ui/          Components V2 cards, theme and emojis
        └── i18n/        Discord command translations
scripts/             maintenance scripts (translation check, imports, seeding)
```

Every command is a typed module. The router hands each handler a context with the server and a translator in the right language:

```ts
export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
  async execute(interaction, { t, guildId }) {
    return interaction.reply(ui.success(t('common.pong')));
  },
});
```

Buttons, menus and forms use custom IDs shaped `command:action:args`; the router sends them to the `components` handlers of the command that created them and enforces admin permissions on them too.

---

## 🧪 Development

| Script                   | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `npm start`              | Start the bot.                                              |
| `npm run dev`            | Start with auto-restart on file changes.                    |
| `npm run deploy`         | Register commands (`-- --global` or `-- --clear` optional). |
| `npm run check`          | Typecheck, lint, translations and tests — run before a PR.  |
| `npm test`               | Run the test suite (Vitest).                                |
| `npm run typecheck`      | Type-check the whole monorepo.                              |
| `npm run lint`           | Lint with ESLint.                                           |
| `npm run format`         | Format with Prettier.                                       |
| `npm run check:i18n`     | Check Discord command translations and help pages.          |
| `npm run seed:shop`      | Add starter items to a server's shop.                       |
| `npm run migrate:legacy` | Import data from the original v1 bot.                       |

The tests cover the economy, loans, raffle, shop, migrations, the exact house edge of every game, and an end-to-end run of every command, button, menu and form in both languages. GitHub Actions runs `npm run check` on every push.

### Adding a language

1. Copy `packages/i18n/src/locales/en.ts` (for example to `pt.ts`), translate it and register it in `packages/i18n/src/index.ts`. TypeScript reports any missing key.
2. Add Discord command translations in `apps/bot/src/i18n/` and run `npm run check:i18n`.

---

## ⬆️ Upgrading

- **From v2:** start the bot — the database upgrades itself. Existing data is assigned to `GUILD_ID` (or to the only server the bot is in). Back up `storage/spacebet.db` first.
- **From v1:** `npm run migrate:legacy -- <serverId> [path/to/database.sqlite]`, then `npm run deploy`.

---

## 📝 License

Released under the [MIT License](LICENSE). Contributions are welcome — run `npm run check` before opening a pull request.

**SpaceBet** — the universe of betting awaits you! 🌠
