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
    name: 'Grav Boots',
    price: 500,
    description: 'Magnetic soles for walking the outer walls of the Structure.',
    consumable: false,
  },
  {
    name: 'Plasma Cutter',
    price: 300,
    description: 'Slices through bulkheads and scrap alike.',
    consumable: false,
  },
  {
    name: 'Med Patch',
    price: 50,
    description: 'Seals your wounds after a rough shift.',
    consumable: true,
  },
  {
    name: 'Glow Stick',
    price: 20,
    description: 'Lights the way through dead corridors.',
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
