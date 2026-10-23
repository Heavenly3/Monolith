import type { GuildMember, Role } from 'discord.js';
import { accounts, shop, type Product } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import { coins } from '../ui/index.ts';

export type RoleGrant =
  { ok: true; role: Role; alreadyHad?: boolean } | { ok: false; reason: string };

/** Gives a role to a member, checking the bot is allowed to. */
export async function grantRole(
  member: GuildMember,
  roleId: string,
  t: Translator,
): Promise<RoleGrant> {
  const role = member.guild.roles.cache.get(roleId);
  if (!role) return { ok: false, reason: t('shop.roleMissing') };
  if (!role.editable) return { ok: false, reason: t('shop.roleNotEditable', { role }) };
  if (member.roles.cache.has(role.id)) return { ok: true, role, alreadyHad: true };
  try {
    await member.roles.add(role, 'Monolith shop item');
  } catch {
    return { ok: false, reason: t('shop.roleRejected') };
  }
  return { ok: true, role };
}

export type PurchaseResult =
  { ok: true; total: number; role?: Role } | { ok: false; error: string };

/**
 * Full purchase flow shared by /buy and the shop buttons. Permanent items
 * with a role grant it immediately and can only be owned once; consumables
 * go to the inventory to be used later.
 */
export async function buy(
  member: GuildMember,
  product: Product,
  quantity: number,
  t: Translator,
): Promise<PurchaseResult> {
  const guildId = member.guild.id;
  accounts.getAccount(guildId, member.user);
  const grantsNow = Boolean(product.roleId) && !product.consumable;

  if (grantsNow && (quantity > 1 || shop.getQuantity(guildId, member.id, product.id) > 0)) {
    return { ok: false, error: t('shop.alreadyOwned', { item: product.name }) };
  }

  const total = product.price * quantity;
  if (!shop.purchase(guildId, member.id, product, quantity)) {
    const wallet = accounts.findAccount(guildId, member.id)?.wallet ?? 0;
    return {
      ok: false,
      error: t('shop.cantAfford', { total: coins(total), wallet: coins(wallet) }),
    };
  }

  if (grantsNow && product.roleId) {
    const granted = await grantRole(member, product.roleId, t);
    if (!granted.ok) {
      shop.refund(guildId, member.id, product, quantity);
      return { ok: false, error: t('shop.refunded', { reason: granted.reason }) };
    }
    return { ok: true, total, role: granted.role };
  }

  return { ok: true, total };
}
