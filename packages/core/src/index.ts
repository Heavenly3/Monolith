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
export * from './config/rankCard.ts';

export * as accounts from './services/accounts.ts';
export * as audit from './services/audit.ts';
export * as cooldowns from './services/cooldowns.ts';
export * as ledger from './services/ledger.ts';
export * as levels from './services/levels.ts';
export * as crime from './services/crime.ts';
export * as chatMoney from './services/chatMoney.ts';
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
export * as blackjack from './games/blackjack.ts';

export type { DayActivity, LedgerEntry, LedgerReason } from './services/ledger.ts';
export type { AuditEntry } from './services/audit.ts';
export type { CollectedLoan, LoanRequest, RepayResult } from './services/loans.ts';
export type { DrawResult, TicketPurchase } from './services/raffle.ts';
export type { RobResult } from './services/rob.ts';
export type { CrimeResult } from './services/crime.ts';
export type { RoleReward } from './services/roleRewards.ts';
export type { NewProduct } from './services/shop.ts';
export type { WebSession } from './services/webSessions.ts';
export type {
  ActivityContext,
  ImportMode,
  LevelRow,
  MemberLevel,
  MultiplierBreakdown,
  RoleChanges,
  XpAction,
  XpGain,
  XpRecord,
} from './services/levels.ts';
export type {
  Adjustment,
  BalanceImportMode,
  BalanceRecord,
  MoneyAction,
} from './services/accounts.ts';
export type { FormResult } from './services/settingsForm.ts';
export type { BetResult, Settlement } from './games/bets.ts';
export type { SlotOutcome, RouletteColor, KenoParse } from './games/rules.ts';
export type {
  Card as BlackjackCard,
  Finished as BlackjackResult,
  Hand as BlackjackHand,
  Move as BlackjackMove,
  Outcome as BlackjackOutcome,
} from './games/blackjack.ts';

export * from './utils/format.ts';
export * from './utils/parse.ts';
export * from './utils/random.ts';
