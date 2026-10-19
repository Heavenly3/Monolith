// Shapes of the dashboard API responses (apps/api).
import type { FieldType } from '@mythcore/core/browser';

export interface Me {
  id: string;
  username: string;
  avatar: string | null;
}

export interface GuildSummary {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
}

export interface Member {
  userId: string;
  username: string | null;
  wallet: number;
  bank: number;
  netWorth: number;
}

export interface Overview {
  guild: { id: string; name: string; icon: string | null };
  stats: { accounts: number; wallets: number; banks: number };
  top: Member[];
  activeLoans: number;
  products: number;
  raffle: { pot: number; drawAt: number | null; tickets: number };
}

export interface SettingFieldValue {
  id: string;
  type: FieldType;
  min: number | null;
  value: unknown;
  custom: boolean;
}

export interface SettingCategoryValues {
  id: string;
  fields: SettingFieldValue[];
}

export interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface ShopItem {
  id: number;
  name: string;
  price: number;
  description: string | null;
  roleId: string | null;
  consumable: boolean;
}

export interface WheelPrize {
  name: string | null;
  amount: number;
}

export interface Loan {
  userId: string;
  username: string | null;
  principal: number;
  interestRate: number;
  amountDue: number;
  dueAt: number;
  createdAt: number;
}

export interface AuditEntry {
  id: number;
  actorId: string;
  actorName: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: number;
}
