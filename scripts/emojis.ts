// Renders the icon set (apps/bot/src/ui/icons.ts) and uploads it as
// application emojis of your bot, so they work in every server.
//   npm run emojis              upload missing icons
//   npm run emojis -- --force   replace icons that already exist
//   npm run emojis -- --preview only render PNGs to storage/icons/png
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { REST, Routes } from 'discord.js';
import { logger } from '@monolith/core';
import { ROOT_DIR, env } from '../apps/bot/src/env.ts';
import { EMOJI_PREFIX } from '../apps/bot/src/ui/emojis.ts';
import { ICONS, ICON_TILE, type IconSpec } from '../apps/bot/src/ui/icons.ts';

const log = logger.child('emojis');
const args = new Set(process.argv.slice(2));
const CACHE_DIR = path.join(ROOT_DIR, 'storage', 'icons');
const PNG_DIR = path.join(CACHE_DIR, 'png');
const SOURCE = 'https://raw.githubusercontent.com/game-icons/icons/master';

async function fetchSvg(icon: string): Promise<string> {
  const file = path.join(CACHE_DIR, `${icon.replace('/', '__')}.svg`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const response = await fetch(`${SOURCE}/${icon}.svg`);
  if (!response.ok) throw new Error(`Icon "${icon}" not found (${response.status})`);
  const svg = await response.text();
  fs.writeFileSync(file, svg);
  return svg;
}

/** Recolours the glyph and places it on a rounded tile. */
function renderPng({ color }: IconSpec, svg: string): Buffer {
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<path d="M0 0h512v512H0z"\s*\/>/, '')
    .replace(/fill="#fff(?:fff)?"/g, `fill="${color}"`);
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="${ICON_TILE.radius}" fill="${ICON_TILE.fill}"/>
    <g transform="translate(64 64) scale(0.75)">${inner}</g>
  </svg>`;
  return new Resvg(tile, { fitTo: { mode: 'width', value: 128 } }).render().asPng();
}

interface ApplicationEmoji {
  id: string;
  name: string;
}

fs.mkdirSync(PNG_DIR, { recursive: true });
const entries = Object.entries(ICONS) as [string, IconSpec][];
const rendered = new Map<string, Buffer>();
for (const [key, spec] of entries) {
  const png = renderPng(spec, await fetchSvg(spec.icon));
  rendered.set(key, png);
  fs.writeFileSync(path.join(PNG_DIR, `${EMOJI_PREFIX}${key}.png`), png);
}
log.info(`Rendered ${rendered.size} icons into ${path.relative(ROOT_DIR, PNG_DIR)}.`);

if (args.has('--preview')) process.exit(0);

const rest = new REST().setToken(env.token);
const route = Routes.applicationEmojis(env.clientId);
const { items } = (await rest.get(route)) as { items: ApplicationEmoji[] };
const existing = new Map(items.map((emoji) => [emoji.name, emoji.id]));

let created = 0;
let skipped = 0;
for (const [key, png] of rendered) {
  const name = `${EMOJI_PREFIX}${key}`;
  const id = existing.get(name);
  if (id && !args.has('--force')) {
    skipped++;
    continue;
  }
  if (id) await rest.delete(Routes.applicationEmoji(env.clientId, id));
  await rest.post(route, {
    body: { name, image: `data:image/png;base64,${png.toString('base64')}` },
  });
  created++;
}

log.info(`Uploaded ${created} icons (${skipped} already existed). Restart the bot to use them.`);
