# Contributing to SpaceBet

Thanks for helping! Bug reports, translations and pull requests are all welcome.

## Getting started

1. Install [Node.js 22.18+](https://nodejs.org/) (24 LTS recommended).
2. Fork and clone the repository, then run `npm install`.
3. Copy `.env.example` to `.env` with a test bot and a test server (`GUILD_ID`), then `npm run deploy` and `npm run dev`.

## Before opening a pull request

Run the same checks as CI:

```bash
npm run check
```

It type-checks the monorepo, lints, verifies translations and runs the tests.

## Where things live

- **Game rules, economy, database:** `packages/core` — no Discord code here, so the logic can be reused by other apps.
- **Texts:** `packages/i18n/src/locales` — every new text goes in both `en.ts` and `es.ts`.
- **Commands and the `/config` panel:** `apps/bot/src/commands` and `apps/bot/src/panels/config`.

## Guidelines

- Keep pull requests focused on one change.
- Add or update tests in `packages/*/test` or `apps/*/test` for behaviour changes.
- Database changes go in a new entry at the end of `packages/core/src/db/migrations.ts`; never edit a released migration.
- Game changes must keep the house edge below 1 (`packages/core/test/games.test.ts` checks it).
