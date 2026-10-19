// Adds a few starter items to the shop of a server (skips existing names).
//   npm run seed:shop -- <serverId>      (defaults to GUILD_ID from .env)
import { closeDatabase, logger, openDatabase, shop, type NewProduct } from '@spacebet/core';
import { env } from '../apps/bot/src/env.ts';

const log = logger.child('seed');
const guildId = process.argv[2] ?? env.guildId;
if (!guildId) {
  log.error('Pass the server ID: npm run seed:shop -- <serverId>');
  process.exit(1);
}

const ITEMS: NewProduct[] = [
  {
    name: 'Space Horse',
    price: 500,
    description: 'A strong and fast steed bred on Mars.',
    consumable: false,
  },
  {
    name: 'Plasma Sword',
    price: 300,
    description: 'A sharp blade forged in a dying star.',
    consumable: false,
  },
  {
    name: 'Healing Potion',
    price: 50,
    description: 'Restores your health after a rough jump.',
    consumable: true,
  },
  {
    name: 'Oxygen Tank',
    price: 120,
    description: 'Keeps you breathing on spacewalks.',
    consumable: true,
  },
];

openDatabase(env.databasePath);
let added = 0;
for (const item of ITEMS) {
  if (shop.findProductByName(guildId, item.name)) continue;
  shop.addProduct(guildId, item);
  added++;
}
closeDatabase();
log.info(`Added ${added} item(s) to the shop of ${guildId}.`);
