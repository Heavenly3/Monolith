// Renders the icon set (apps/bot/src/ui/icons.ts, Tabler icons) and uploads it
// as application emojis of your bot, so they work in every server.
//   npm run emojis              upload missing icons
//   npm run emojis -- --force   replace icons that already exist
//   npm run emojis -- --prune   also delete application emojis no longer in the set
//   npm run emojis -- --preview only render PNGs (and a contact sheet) to storage/icons
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
const OUT_DIR = path.join(ROOT_DIR, 'storage', 'icons');
const TABLER_DIR = path.join(ROOT_DIR, 'node_modules', '@tabler', 'icons', 'icons');
// Emojis uploaded by earlier versions of the bot, removed by --prune.
const OLD_PREFIXES = ['mc_'];
const SIZE = 128;

// Glyphs drawn for Monolith itself (24×24, filled), used as "custom/<name>".
const CUSTOM: Record<string, string> = {
  // A tall slab with a lit edge: the Monolith.
  monolith:
    '<path d="M8 2.5h8.5v19H8z"/><path d="M16.5 2.5l1.5 1.2v17.1l-1.5 0.7z" opacity="0.55"/>',
};

function readIcon(name: string): { inner: string; filled: boolean } {
  if (name.startsWith('custom/')) {
    const glyph = CUSTOM[name.slice('custom/'.length)];
    if (!glyph) throw new Error(`Custom icon "${name}" not found`);
    return { inner: glyph, filled: true };
  }
  const filled = name.startsWith('filled/');
  const file = path.join(
    TABLER_DIR,
    filled ? 'filled' : 'outline',
    `${name.replace('filled/', '')}.svg`,
  );
  if (!fs.existsSync(file)) throw new Error(`Tabler icon "${name}" not found`);
  const inner = fs
    .readFileSync(file, 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    // Tabler's invisible 24×24 bounding box.
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '');
  return { inner, filled };
}

/** Graphite panel with a thin edge, a small accent mark and the icon in its colour. */
function renderSvg({ icon, color }: IconSpec): string {
  const { inner, filled } = readIcon(icon);
  const glyph = filled
    ? `<g fill="${color}">${inner.replaceAll('currentColor', color)}</g>`
    : `<g fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner.replaceAll('currentColor', color)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect x="3" y="3" width="122" height="122" rx="${ICON_TILE.radius}" fill="${ICON_TILE.fill}" stroke="${ICON_TILE.edge}" stroke-width="3"/>
    <rect x="16" y="108" width="20" height="4" rx="1" fill="${color}" opacity="0.85"/>
    <g transform="translate(28 22) scale(3)">${glyph}</g>
  </svg>`;
}

const toPng = (svg: string, width = SIZE): Buffer =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

/** One image with every icon, to review the set at a glance. */
function contactSheet(entries: [string, IconSpec][]): Buffer {
  const columns = 12;
  const cell = 140;
  const rows = Math.ceil(entries.length / columns);
  const tiles = entries
    .map(([, spec], i) => {
      const x = (i % columns) * cell + 6;
      const y = Math.floor(i / columns) * cell + 6;
      return `<g transform="translate(${x} ${y})">${renderSvg(spec).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cell}" height="${rows * cell}"><rect width="100%" height="100%" fill="#0b0d10"/>${tiles}</svg>`;
  return toPng(svg, columns * cell);
}

interface ApplicationEmoji {
  id: string;
  name: string;
}

const entries = Object.entries(ICONS) as [string, IconSpec][];
fs.mkdirSync(path.join(OUT_DIR, 'png'), { recursive: true });
const rendered = new Map<string, Buffer>();
for (const [key, spec] of entries) {
  const png = toPng(renderSvg(spec));
  rendered.set(key, png);
  fs.writeFileSync(path.join(OUT_DIR, 'png', `${EMOJI_PREFIX}${key}.png`), png);
}
fs.writeFileSync(path.join(OUT_DIR, 'sheet.png'), contactSheet(entries));
log.info(`Rendered ${rendered.size} icons into ${path.relative(ROOT_DIR, OUT_DIR)}.`);

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

let pruned = 0;
if (args.has('--prune')) {
  const wanted = new Set([...rendered.keys()].map((key) => `${EMOJI_PREFIX}${key}`));
  for (const emoji of items) {
    const ours = [EMOJI_PREFIX, ...OLD_PREFIXES].some((prefix) => emoji.name.startsWith(prefix));
    if (ours && !wanted.has(emoji.name)) {
      await rest.delete(Routes.applicationEmoji(env.clientId, emoji.id));
      pruned++;
    }
  }
}

log.info(
  `Uploaded ${created} icons (${skipped} already existed, ${pruned} old ones removed). Restart the bot to use them.`,
);
