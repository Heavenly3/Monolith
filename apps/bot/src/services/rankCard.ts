// Turns the rank card SVG into a PNG with resvg. The font ships with the bot
// so the card looks the same on every machine.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { rankCardSvg, settings, type RankCardData, type RankCardDesign } from '@monolith/core';

const FONTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/fonts');
const FONT_FILES = ['ChakraPetch-Bold.ttf', 'ChakraPetch-Medium.ttf'].map((file) =>
  path.join(FONTS_DIR, file),
);

/** The card as a PNG. */
export function renderRankCard(data: RankCardData): Buffer {
  const svg = new Resvg(rankCardSvg(data), {
    font: { fontFiles: FONT_FILES, loadSystemFonts: true, defaultFontFamily: 'Chakra Petch' },
    fitTo: { mode: 'original' },
  });
  return svg.render().asPng();
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Downloads a PNG or JPEG as a data URI for the card; null on any failure. */
export async function imageData(url: string, timeoutMs = 3000): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return null;
    const type = (response.headers.get('content-type') ?? '').split(';')[0]!.trim();
    if (!/^image\/(png|jpeg)$/.test(type)) return null;
    if (Number(response.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

// Server backgrounds change rarely: keep each download for a while.
const BACKGROUND_CACHE_MS = 10 * 60_000;
const backgrounds = new Map<string, { data: string | null; until: number }>();

async function backgroundData(url: string): Promise<string | null> {
  const cached = backgrounds.get(url);
  if (cached && cached.until > Date.now()) return cached.data;
  const data = await imageData(url, 4000);
  backgrounds.set(url, { data, until: Date.now() + BACKGROUND_CACHE_MS });
  if (backgrounds.size > 200) backgrounds.delete(backgrounds.keys().next().value!);
  return data;
}

/** The server's card design, with its background picture ready to draw. */
export async function designOf(guildId: string): Promise<RankCardDesign> {
  const background = settings.get(guildId, 'levels.rankBackground');
  return {
    theme: settings.get(guildId, 'levels.rankTheme'),
    accent: settings.get(guildId, 'levels.rankAccent'),
    background: background ? await backgroundData(background) : null,
    dim: settings.get(guildId, 'levels.rankDim'),
  };
}
