// Adds a few starter wares to the market of a server (skips existing names).
//   npm run seed:shop -- <serverId>      (defaults to GUILD_ID from .env)
import { closeDatabase, logger, openDatabase, shop, type NewProduct } from '@monolith/core';
import { env } from '../apps/bot/src/env.ts';

const log = logger.child('seed');
const guildId = process.argv[2] ?? env.guildId;
if (!guildId) {
  log.error('Pass the server ID: npm run seed:shop -- <serverId>');
  process.exit(1);
}

const ITEMS: NewProduct[] = [
  {
    name: 'War Horse',
    price: 500,
    description: 'A strong and loyal steed raised in the royal stables.',
    consumable: false,
  },
  {
    name: 'Dwarven Sword',
    price: 300,
    description: 'A sharp blade forged deep under the mountain.',
    consumable: false,
  },
  {
    name: 'Healing Potion',
    price: 50,
    description: 'Mends your wounds after a rough quest.',
    consumable: true,
  },
  {
    name: 'Torch',
    price: 20,
    description: 'Lights the way through dark dungeons.',
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
