// Turns the rank card SVG into a PNG with resvg. The font ships with the bot
// so the card looks the same on every machine.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { rankCardSvg, type RankCardData } from '@monolith/core';

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

/** Downloads an avatar as a data URI for the card; null on any failure. */
export async function avatarData(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    const type = response.headers.get('content-type') ?? 'image/png';
    if (!/^image\/(png|jpeg)$/.test(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}
