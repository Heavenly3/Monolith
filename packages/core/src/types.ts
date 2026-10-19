/** The two balances every member has in a server. */
export type Balance = 'wallet' | 'bank';

/** Minimal user shape (compatible with discord.js User). */
export interface UserRef {
  id: string;
  username: string;
}

export interface Account {
  guildId: string;
  userId: string;
  wallet: number;
  bank: number;
}

export interface LeaderboardRow {
  userId: string;
  username: string | null;
  wallet: number;
  bank: number;
  netWorth: number;
}

export interface Product {
  id: number;
  guildId: string;
  name: string;
  price: number;
  description: string | null;
  roleId: string | null;
  consumable: boolean;
}

export interface InventoryItem extends Product {
  quantity: number;
}

export interface Loan {
  guildId: string;
  userId: string;
  principal: number;
  interestRate: number;
  amountDue: number;
  dueAt: number;
  createdAt: number;
}

export interface RaffleRound {
  guildId: string;
  pot: number;
  drawAt: number | null;
  channelId: string | null;
}
