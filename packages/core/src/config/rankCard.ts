// The /rank image as SVG, in the Monolith style (graphite panel, a themed
// pattern, bracketed corners). Browser-safe: the bot turns it into a PNG and
// the dashboard shows it as a live preview while it is being designed.
import type { RankTheme } from './defaults.ts';
import { formatNumber } from '../utils/format.ts';

/** Quick picks offered next to the free colour picker. */
export const RANK_ACCENT_PRESETS = [
  '#5ec8e5',
  '#e8a23c',
  '#46d1c2',
  '#e5484d',
  '#9b8cf2',
  '#5fd068',
  '#f2f4f6',
] as const;

export interface RankCardDesign {
  theme: RankTheme;
  /** #rrggbb */
  accent: string;
  /** Background picture (a data URI in the bot, a URL in the dashboard), or null. */
  background: string | null;
  /** Darkening over the background picture, 0–95. */
  dim: number;
}

export interface RankCardData {
  name: string;
  /** PNG or JPEG as a data URI (or URL); null draws the initial instead. */
  avatar: string | null;
  level: number;
  rank: number | null;
  xp: number;
  current: number;
  needed: number;
  messages: number;
  design: RankCardDesign;
  labels: { level: string; rank: string; xp: string; messages: string; max: string };
}

const W = 1000;
const H = 300;
const RIGHT = 940;

const escape = (text: string): string => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const safeColor = (value: string): string =>
  /^#[0-9a-f]{6}$/i.test(value) ? value : RANK_ACCENT_PRESETS[0];

/** Cuts long names so they never run into the level block. */
function fit(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : text;
}

// Characters Chakra Petch draws: Latin with accents, Vietnamese and common punctuation.
const CHAKRA = /^[ -ɏḀ-ỿ‐-‧‰-⁞€]$/u;
const LETTER = /[\p{L}\p{N}]/u;
const FALLBACK_FONTS = 'Segoe UI, Noto Sans, Noto Sans CJK JP, DejaVu Sans, sans-serif';

/**
 * The name as the card can draw it. resvg moves a whole line to another font
 * when one character is missing, so symbols and emoji the card font lacks are
 * left out; a name with nothing readable left is drawn in a system font.
 */
function nameText(name: string): { text: string; fallback: boolean } {
  const kept = [...name]
    .filter((char) => CHAKRA.test(char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return LETTER.test(kept) ? { text: kept, fallback: false } : { text: name, fallback: true };
}

/** Rough width of a text in Chakra Petch, enough to place blocks side by side. */
const widthOf = (text: string, size: number, spacing = 0): number =>
  [...text].length * (size * 0.6 + spacing);

/** Pattern of each theme, drawn over the panel. */
function themePattern(theme: RankTheme, accent: string): { defs: string; layer: string } {
  switch (theme) {
    case 'blueprint':
      return {
        defs: `<pattern id="pattern" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0 H0 V24" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>`,
        layer: `<rect width="${W}" height="${H}" fill="url(#pattern)"/>`,
      };
    case 'scanlines':
      return {
        defs: `<pattern id="pattern" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" fill-opacity="0.045"/>
    </pattern>`,
        layer: `<rect width="${W}" height="${H}" fill="url(#pattern)"/>`,
      };
    case 'hazard':
      return {
        defs: `<pattern id="pattern" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="28" fill="${accent}" fill-opacity="0.07"/>
    </pattern>`,
        layer: `<rect x="${W - 260}" width="260" height="${H}" fill="url(#pattern)"/>
    <rect width="${W}" height="10" y="${H - 10}" fill="url(#pattern)"/>`,
      };
    case 'circuit':
      return {
        defs: `<pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.6" fill="${accent}" fill-opacity="0.18"/>
      <path d="M4 4 H24 V24 H40" fill="none" stroke="${accent}" stroke-opacity="0.08" stroke-width="1.2"/>
    </pattern>`,
        layer: `<rect width="${W}" height="${H}" fill="url(#pattern)"/>`,
      };
    case 'plain':
      return { defs: '', layer: '' };
  }
}

/** Four L-shaped brackets just inside the panel corners. */
function brackets(color: string): string {
  const s = 22;
  const m = 14;
  const corners: [number, number, number, number][] = [
    [m, m, 1, 1],
    [W - m, m, -1, 1],
    [m, H - m, 1, -1],
    [W - m, H - m, -1, -1],
  ];
  return corners
    .map(
      ([x, y, dx, dy]) =>
        `<path d="M${x} ${y + dy * s} V${y} H${x + dx * s}" fill="none" stroke="${color}" stroke-width="3"/>`,
    )
    .join('');
}

export function rankCardSvg(data: RankCardData): string {
  const { design, labels } = data;
  const accent = safeColor(design.accent);
  const maxed = data.needed === 0;
  const ratio = maxed ? 1 : Math.min(1, Math.max(0, data.current / data.needed));
  const bar = { x: 300, y: 196, w: 640, h: 30 };
  const fill = Math.max(bar.h, Math.round(bar.w * ratio));
  const initial = escape([...data.name.trim()][0]?.toUpperCase() ?? '?');
  const progress = maxed
    ? labels.max
    : `${formatNumber(data.current)} / ${formatNumber(data.needed)} ${labels.xp}`;
  const pattern = themePattern(design.theme, accent);

  // Level on the right, rank to its left: each block is as wide as its label or its number.
  const levelLabel = labels.level.toUpperCase();
  const rankLabel = labels.rank.toUpperCase();
  const levelWidth = Math.max(widthOf(levelLabel, 22, 3), widthOf(String(data.level), 64));
  const rankRight = RIGHT - levelWidth - 36;
  const rankText = data.rank ? `#${data.rank}` : '';
  const rankWidth = data.rank ? Math.max(widthOf(rankLabel, 22, 3), widthOf(rankText, 40)) : 0;
  const nameRoom = rankRight - (data.rank ? rankWidth + 24 : 0) - 300;
  const shown = nameText(data.name);
  const name = escape(fit(shown.text, Math.max(6, Math.floor(nameRoom / 27))));
  const nameFont = shown.fallback ? ` font-family="${FALLBACK_FONTS}"` : '';

  const avatar = data.avatar
    ? `<image href="${escape(data.avatar)}" x="50" y="50" width="200" height="200" clip-path="url(#round)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="150" cy="150" r="100" fill="#1a1e23"/>
       <text x="150" y="182" font-size="92" font-weight="700" fill="${accent}" text-anchor="middle">${initial}</text>`;
  const background = design.background
    ? `<image href="${escape(design.background)}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
    <rect width="${W}" height="${H}" fill="#0b0d10" fill-opacity="${Math.min(95, Math.max(0, design.dim)) / 100}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Chakra Petch, Segoe UI, Noto Sans, DejaVu Sans, sans-serif">
  <defs>
    ${pattern.defs}
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.75"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <clipPath id="round"><circle cx="150" cy="150" r="100"/></clipPath>
    <clipPath id="panel"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#panel)">
    <rect width="${W}" height="${H}" fill="#0f1215"/>
    ${background}
    ${pattern.layer}
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect width="8" height="${H}" fill="${accent}"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="#2c333b" stroke-width="2"/>
  ${brackets(accent)}

  <circle cx="150" cy="150" r="108" fill="none" stroke="${accent}" stroke-width="4"/>
  <circle cx="150" cy="150" r="116" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 8"/>
  ${avatar}

  <text x="300" y="${maxed ? 150 : 140}" font-size="46" font-weight="700" fill="#eef2f5"${nameFont}>${name}</text>

  <g text-anchor="end">
    <text x="${RIGHT}" y="86" font-size="22" font-weight="500" fill="#8a949e" letter-spacing="3">${escape(levelLabel)}</text>
    <text x="${RIGHT}" y="140" font-size="64" font-weight="700" fill="${accent}">${data.level}</text>
    ${
      data.rank
        ? `<text x="${rankRight}" y="86" font-size="22" font-weight="500" fill="#8a949e" letter-spacing="3">${escape(rankLabel)}</text>
    <text x="${rankRight}" y="140" font-size="40" font-weight="700" fill="#eef2f5">${rankText}</text>`
        : ''
    }
  </g>

  <text x="${RIGHT}" y="182" font-size="22" font-weight="500" fill="#c2c9d1" text-anchor="end">${escape(progress)}</text>
  <rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${bar.h}" rx="${bar.h / 2}" fill="#1a1e23" stroke="#2c333b" stroke-width="2"/>
  <rect x="${bar.x}" y="${bar.y}" width="${fill}" height="${bar.h}" rx="${bar.h / 2}" fill="url(#fill)"/>

  <text x="300" y="262" font-size="20" font-weight="500" fill="#8a949e" letter-spacing="2">${escape(
    `${formatNumber(data.xp)} ${labels.xp.toUpperCase()}  ·  ${formatNumber(data.messages)} ${labels.messages.toUpperCase()}`,
  )}</text>
  <text x="${RIGHT}" y="262" font-size="20" font-weight="700" fill="${accent}" fill-opacity="0.8" text-anchor="end" letter-spacing="4">MONOLITH</text>
</svg>`;
}
