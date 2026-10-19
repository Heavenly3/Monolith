import { many, one, run, transaction } from '../db/database.ts';
import * as accounts from './accounts.ts';
import type { InventoryItem, Product } from '../types.ts';

interface ProductRow {
  id: number;
  guild_id: string;
  name: string;
  price: number;
  description: string | null;
  role_id: string | null;
  consumable: number;
}

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  guildId: row.guild_id,
  name: row.name,
  price: row.price,
  description: row.description,
  roleId: row.role_id,
  consumable: Boolean(row.consumable),
});

const COLUMNS = 'id, guild_id, name, price, description, role_id, consumable';

export function listProducts(guildId: string): Product[] {
  return many<ProductRow>(
    `SELECT ${COLUMNS} FROM products WHERE guild_id = ? ORDER BY price, name`,
    guildId,
  ).map(toProduct);
}

export function getProduct(guildId: string, id: number): Product | null {
  const row = one<ProductRow>(
    `SELECT ${COLUMNS} FROM products WHERE guild_id = ? AND id = ?`,
    guildId,
    id,
  );
  return row ? toProduct(row) : null;
}

export function findProductByName(guildId: string, name: string): Product | null {
  const row = one<ProductRow>(
    `SELECT ${COLUMNS} FROM products WHERE guild_id = ? AND name = ?`,
    guildId,
    name.trim(),
  );
  return row ? toProduct(row) : null;
}

/** Resolves autocomplete values (product id) as well as typed names. */
export function resolveProduct(guildId: string, input: string): Product | null {
  if (/^\d+$/.test(input))
    return getProduct(guildId, Number(input)) ?? findProductByName(guildId, input);
  return findProductByName(guildId, input);
}

export function searchProducts(guildId: string, query: string, limit = 25): Product[] {
  const pattern = `%${query.replace(/[%_\\]/g, '\\$&')}%`;
  return many<ProductRow>(
    `SELECT ${COLUMNS} FROM products WHERE guild_id = ? AND name LIKE ? ESCAPE '\\' ORDER BY name LIMIT ?`,
    guildId,
    pattern,
    limit,
  ).map(toProduct);
}

export interface NewProduct {
  name: string;
  price: number;
  description?: string | null;
  roleId?: string | null;
  consumable: boolean;
}

export function addProduct(guildId: string, input: NewProduct): Product {
  const { lastId } = run(
    `INSERT INTO products (guild_id, name, price, description, role_id, consumable)
     VALUES (?, ?, ?, ?, ?, ?)`,
    guildId,
    input.name.trim(),
    input.price,
    input.description?.trim() || null,
    input.roleId ?? null,
    input.consumable ? 1 : 0,
  );
  return getProduct(guildId, lastId)!;
}

/** Deletes a product; it also disappears from every inventory. */
export function removeProduct(guildId: string, id: number): boolean {
  return run('DELETE FROM products WHERE guild_id = ? AND id = ?', guildId, id).changes > 0;
}

export function getQuantity(guildId: string, userId: string, productId: number): number {
  return (
    one<{ quantity: number }>(
      'SELECT quantity FROM inventory WHERE guild_id = ? AND user_id = ? AND product_id = ?',
      guildId,
      userId,
      productId,
    )?.quantity ?? 0
  );
}

export function getInventory(guildId: string, userId: string): InventoryItem[] {
  return many<ProductRow & { quantity: number }>(
    `SELECT p.id, p.guild_id, p.name, p.price, p.description, p.role_id, p.consumable, i.quantity
     FROM inventory i JOIN products p ON p.id = i.product_id
     WHERE i.guild_id = ? AND i.user_id = ? ORDER BY p.name`,
    guildId,
    userId,
  ).map((row) => ({ ...toProduct(row), quantity: row.quantity }));
}

export function addItem(
  guildId: string,
  userId: string,
  productId: number,
  quantity: number,
): void {
  run(
    `INSERT INTO inventory (guild_id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)
     ON CONFLICT (guild_id, user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity`,
    guildId,
    userId,
    productId,
    quantity,
  );
}

/** Removes items from an inventory. Returns false if there are not enough. */
export function removeItem(
  guildId: string,
  userId: string,
  productId: number,
  quantity: number,
): boolean {
  return transaction(() => {
    const owned = getQuantity(guildId, userId, productId);
    if (owned < quantity) return false;
    if (owned === quantity) {
      run(
        'DELETE FROM inventory WHERE guild_id = ? AND user_id = ? AND product_id = ?',
        guildId,
        userId,
        productId,
      );
    } else {
      run(
        `UPDATE inventory SET quantity = quantity - ?
         WHERE guild_id = ? AND user_id = ? AND product_id = ?`,
        quantity,
        guildId,
        userId,
        productId,
      );
    }
    return true;
  });
}

/** Charges the wallet and adds the items. Returns false if funds are short. */
export function purchase(
  guildId: string,
  userId: string,
  product: Product,
  quantity: number,
): boolean {
  return transaction(() => {
    if (!accounts.debit(guildId, userId, product.price * quantity, 'purchase')) return false;
    addItem(guildId, userId, product.id, quantity);
    return true;
  });
}

/** Undoes a purchase (used when a role cannot be granted). */
export function refund(guildId: string, userId: string, product: Product, quantity: number): void {
  transaction(() => {
    removeItem(guildId, userId, product.id, quantity);
    accounts.credit(guildId, userId, product.price * quantity, 'refund');
  });
}
