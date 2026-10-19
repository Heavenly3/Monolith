# ⚜️ Mythcore

**Mythcore** is an economy and casino bot for Discord with a medieval fantasy theme. Members work to earn gold, keep it in the bank, bet it in four tavern games, take loans, play the lottery and spend it in a role shop — all through clear slash commands, Discord's **Components V2** layout and a hand-picked icon set. Every server has its own economy.

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
- [Web dashboard](#-web-dashboard)
- [Architecture](#%EF%B8%8F-architecture)
- [Development](#-development)
- [Upgrading](#%EF%B8%8F-upgrading)
- [License](#-license)

---

## ✨ Features

- **One economy per server** — balances, shop, settings and leaderboard are separate in every server the bot joins.
- **Clear commands, medieval flavour** — commands have the names people expect (`/balance`, `/work`, `/slots`, `/shop`...), while texts, colours and custom icons from [game-icons.net](https://game-icons.net) set a medieval fantasy mood.
- **English and Spanish** — replies follow each member's Discord language, or a language chosen by the admins. Command names, options and descriptions are translated in the Discord client too (`/saldo`, `/trabajar`, `/tragaperras`...).
- **Settings panel (`/config`)** — set up everything without typing commands: language, members' gold, work, role income, the Wheel of Fortune, game cooldowns, shop items, loans and the lottery. Destructive actions ask for confirmation, and every change is recorded in an audit log.
- **Built-in guide (`/help`)** — explains every command, option, game payout and setting, with live values and clickable commands.
- **Fair tavern games** — Dragon's Hoard, Wizard's Roulette, the Royal Joust and Oracle's Runes, with animations, cryptographically secure randomness and a house edge verified by tests.
- **Transaction ledger** — every coin that moves is recorded with its reason and resulting balance.
- **Nothing to compile** — strict TypeScript that Node runs directly, with data in Node's built-in SQLite.

---

## 🎮 Commands

Amounts accept `500`, `1,500`, `2.5k`, `1m`, `half`/`mitad` or `all`/`todo`. Use `/help` in Discord for the full guide, or `/help command:<name>` for one command.

| Category   | Commands                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ |
| 💰 Economy | `/balance` `/deposit` `/withdraw` `/pay` `/work` `/collect` `/wheel` `/rob` `/leaderboard` |
| 🎲 Games   | `/slots` `/roulette` `/race` `/keno` `/lottery buy` `/lottery info`                        |
| 📃 Loans   | `/loan request` `/loan status` `/loan repay`                                               |
| 🏪 Shop    | `/shop` `/buy` `/use` `/inventory`                                                         |
| ⚙️ Admin   | `/config`                                                                                  |
| 📖 Help    | `/help`                                                                                    |

Members with Discord in Spanish see the Spanish names: `/saldo` `/depositar` `/retirar` `/pagar` `/trabajar` `/cobrar` `/rueda` `/robar` `/ranking` `/tragaperras` `/ruleta` `/carrera` `/keno` `/loteria` `/prestamo` `/tienda` `/comprar` `/usar` `/inventario` `/ayuda` `/config`.

`/config` is hidden from members without the **Administrator** permission. You can grant it to other roles in **Server Settings → Integrations → Mythcore**.

### Payouts

All games return the bet multiplied by the number shown (bet included).

| Game           | Payouts                                                              |
| -------------- | -------------------------------------------------------------------- |
| 🎰 Slots       | Pair ×1.5 · Three of a kind ×10 · Three dragons ×25                  |
| 🎡 Roulette    | Colour / even / odd / low / high ×2 · Dozen / column ×3 · Number ×36 |
| 🏇 Knight race | 1st ×6 · 2nd ×2 · 3rd ×1 (bet back)                                  |
| 🔢 Keno        | Depends on how many numbers you pick (1–10) and how many match       |

Rules and paytables live in [packages/core/src/config/games.ts](packages/core/src/config/games.ts).

---

## ⚙️ Quick start

**Requirements:** [Node.js 22.18 or newer](https://nodejs.org/) (Node 24 LTS recommended).

1. **Clone and install**

   ```bash
   git clone https://github.com/Heavenly3/SpaceBet.git
   cd Mythcore
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
   | `DATABASE_PATH` |          | SQLite file location. Default: `storage/mythcore.db`.                  |
   | `LOG_LEVEL`     |          | `debug`, `info`, `warn` or `error`. Default: `info`.                   |

4. **Register the slash commands and start the bot**

   ```bash
   npm run deploy
   npm start
   ```

5. **Upload the icon set** (recommended) — renders the fantasy icons and uploads them as application emojis of your bot, so they work in every server:

   ```bash
   npm run emojis
   ```

   Restart the bot afterwards. Without this step the bot uses standard Unicode emojis.

   Optionally stock a server's market with `npm run seed:shop -- <serverId>`.

---

## 🔧 Configuration

- **In Discord:** everything is set up from `/config`, per server. _General → Language_ chooses between automatic (each member's Discord language), English or Spanish.
- **Defaults:** [packages/core/src/config/defaults.ts](packages/core/src/config/defaults.ts) holds the starting value of every setting.
- **Look and feel:** [apps/bot/src/ui/theme.ts](apps/bot/src/ui/theme.ts) (name and colours), [apps/bot/src/ui/emojis.ts](apps/bot/src/ui/emojis.ts) (Unicode fallbacks) and [apps/bot/src/ui/icons.ts](apps/bot/src/ui/icons.ts) (which game-icons.net icon and colour each emoji uses). After changing `icons.ts`, run `npm run emojis -- --force`.

---

## 🌐 Web dashboard

Manage a server from the browser: settings, jobs, wheel prizes, role income, members' gold, the shop, loans and the change history, in English or Spanish. It uses the same rules as `/config`, so every change applies in Discord at once. Built with Vue 3 and PrimeVue 4.

**Set up once:** in the Developer Portal open **OAuth2**, copy the **Client Secret** into `.env` as `CLIENT_SECRET` and add `http://localhost:3000/auth/callback` under **Redirects**.

**Development** — run each in its own terminal, next to the bot:

```bash
npm run api   # dashboard API on http://localhost:3000
npm run web   # dashboard on http://localhost:5180 (reloads on save)
```

**Production** — build the dashboard once and the API serves it too, from a single port:

```bash
npm run build:web
npm run api
```

When it runs on a public address, set `API_URL` and `WEB_URL` in `.env` to that address (for example `https://mythcore.example.com`) and add `<API_URL>/auth/callback` to the Redirects.

### API

Only server owners and administrators can manage a server, and only when the bot is in it. Sessions are stored as hashes, changes must come from the dashboard's own address, and every change is recorded in the audit log.

| Area     | Endpoints (under `/api/guilds/:guildId`)                                        |
| -------- | ------------------------------------------------------------------------------- |
| Overview | `GET /` — totals, top members, loans, shop and lottery                          |
| Settings | `GET /settings` · `PUT /settings/:category` · `POST /settings/:category/reset`  |
| Work     | `GET/POST /work/messages` · `DELETE /work/messages/:index` · `POST /work/reset` |
| Wheel    | `GET/POST /wheel` · `DELETE /wheel/:index` · `POST /wheel/reset`                |
| Members  | `GET /members` · `GET /members/:userId` · `POST /members/:userId/adjust`        |
| Shop     | `GET/POST /shop` · `DELETE /shop/:itemId` · `GET /roles`                        |
| Income   | `GET /role-income` · `PUT/DELETE /role-income/:roleId`                          |
| Loans    | `GET /loans` · `DELETE /loans/:userId` · `DELETE /loans`                        |
| History  | `GET /audit`                                                                    |

Outside a server: `GET /auth/login`, `POST /auth/logout`, `GET /api/me` and `GET /api/guilds`.

---

## 🏗️ Architecture

Mythcore is a monorepo (npm workspaces) so the bot and the web dashboard share the same rules and data.

```
packages/
├── i18n/            @mythcore/i18n — English and Spanish texts, pure TypeScript
└── core/            @mythcore/core — database, migrations and domain logic, no Discord code
    └── src/
        ├── db/          SQLite connection and versioned migrations
        ├── services/    accounts, ledger, settings, shop, loans, raffle, rob, audit...
        ├── games/       pure game rules and the betting flow
        └── config/      defaults, game tables and the settings schema
apps/
├── api/             @mythcore/api — dashboard API (Fastify, Discord login)
│   └── src/
│       ├── routes/      auth, settings, economy, shop
│       ├── access.ts    who can manage which server
│       └── discord.ts   Discord OAuth2 and REST client
├── web/             @mythcore/web — the dashboard (Vue 3, PrimeVue 4, Vite)
│   └── src/
│       ├── views/       one page per section
│       ├── components/  settings form, editors, cards
│       ├── lib/         API client, session, formatting
│       └── i18n/        dashboard texts (settings labels come from @mythcore/i18n)
└── bot/             @mythcore/bot — the Discord bot
    └── src/
        ├── commands/    one file per slash command, grouped by category
        ├── panels/      the settings panel (/config), one file per section
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

| Script                   | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `npm start`              | Start the bot.                                                 |
| `npm run dev`            | Start with auto-restart on file changes.                       |
| `npm run api`            | Start the dashboard API (`npm run dev:api` to auto-restart).   |
| `npm run web`            | Start the dashboard in development mode.                       |
| `npm run build:web`      | Build the dashboard; `npm run api` then serves it.             |
| `npm run deploy`         | Register commands (`-- --global` or `-- --clear` optional).    |
| `npm run check`          | Typecheck, lint, translations and tests — run before a PR.     |
| `npm test`               | Run the test suite (Vitest).                                   |
| `npm run typecheck`      | Type-check the whole monorepo.                                 |
| `npm run lint`           | Lint with ESLint.                                              |
| `npm run format`         | Format with Prettier.                                          |
| `npm run check:i18n`     | Check Discord command translations and help pages.             |
| `npm run emojis`         | Render and upload the icon set (`-- --force`, `-- --preview`). |
| `npm run seed:shop`      | Add starter wares to a server's market.                        |
| `npm run migrate:legacy` | Import data from the original v1 bot.                          |

The tests cover the economy, loans, raffle, shop, migrations, the exact house edge of every game, and an end-to-end run of every command, button, menu and form in both languages. GitHub Actions runs `npm run check` on every push.

### Adding a language

1. Copy `packages/i18n/src/locales/en.ts` (for example to `pt.ts`), translate it and register it in `packages/i18n/src/index.ts`. TypeScript reports any missing key.
2. Add Discord command translations in `apps/bot/src/i18n/` and run `npm run check:i18n`.

---

## ⬆️ Upgrading

- **From v2:** start the bot — the database upgrades itself. Existing data is assigned to `GUILD_ID` (or to the only server the bot is in). Back up `storage/mythcore.db` first.
- **From v1:** `npm run migrate:legacy -- <serverId> [path/to/database.sqlite]`, then `npm run deploy`.

---

## 📝 License

Released under the [MIT License](LICENSE).

Icons by [Lorc](https://lorcblog.blogspot.com), [Delapouite](https://delapouite.com), Skoll, Caro Asercion and Sbed, from [game-icons.net](https://game-icons.net), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). They are recoloured and placed on tiles by `npm run emojis`. Contributions are welcome — run `npm run check` before opening a pull request.

**Mythcore** — fortune favours the bold! ⚔️
