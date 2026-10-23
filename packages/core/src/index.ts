// Public API of @monolith/core. Everything here is independent from Discord,
// so the bot and the web dashboard share the same rules and data.
export { logger, createLogger, type Logger } from './logger.ts';
export { openDatabase, closeDatabase, claimLegacyData, transaction, db } from './db/database.ts';
export { LEGACY_GUILD } from './db/migrations.ts';

export * from './types.ts';
export * from './config/defaults.ts';
export * from './config/games.ts';
export * from './config/settingsSchema.ts';
export * from './config/levels.ts';

export * as accounts from './services/accounts.ts';
export * as audit from './services/audit.ts';
export * as cooldowns from './services/cooldowns.ts';
export * as ledger from './services/ledger.ts';
export * as levels from './services/levels.ts';
export * as loans from './services/loans.ts';
export * as raffle from './services/raffle.ts';
export * as rob from './services/rob.ts';
export * as roleRewards from './services/roleRewards.ts';
export * as settings from './services/settings.ts';
export * as settingsForm from './services/settingsForm.ts';
export * as shop from './services/shop.ts';
export * as webSessions from './services/webSessions.ts';
export * as wheel from './services/wheel.ts';
export * as work from './services/work.ts';

export * as bets from './games/bets.ts';
export * as rules from './games/rules.ts';

export type { LedgerEntry, LedgerReason } from './services/ledger.ts';
export type { AuditEntry } from './services/audit.ts';
export type { CollectedLoan, LoanRequest, RepayResult } from './services/loans.ts';
export type { DrawResult, TicketPurchase } from './services/raffle.ts';
export type { RobResult } from './services/rob.ts';
export type { RoleReward } from './services/roleRewards.ts';
export type { NewProduct } from './services/shop.ts';
export type { WebSession } from './services/webSessions.ts';
export type {
  ActivityContext,
  LevelRow,
  MemberLevel,
  MultiplierBreakdown,
  RoleChanges,
  XpAction,
  XpGain,
} from './services/levels.ts';
export type { Adjustment, MoneyAction } from './services/accounts.ts';
export type { FormResult } from './services/settingsForm.ts';
export type { BetResult, Settlement } from './games/bets.ts';
export type { SlotOutcome, RouletteColor, KenoParse } from './games/rules.ts';

export * from './utils/format.ts';
export * from './utils/parse.ts';
export * from './utils/random.ts';
