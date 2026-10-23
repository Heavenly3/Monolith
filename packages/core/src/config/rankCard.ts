// The /rank image as SVG, in the Monolith style (graphite panel, blueprint
// grid, bracketed corners). Browser-safe: the bot turns it into a PNG and
// the dashboard shows it as a live preview.
import type { RankColor } from './defaults.ts';
import { formatNumber } from '../utils/format.ts';

/** Accent colours a server can pick for its rank cards. */
export const RANK_COLOR_HEX: Record<RankColor, string> = {
  cyan: '#5ec8e5',
  amber: '#e8a23c',
  teal: '#46d1c2',
  red: '#e5484d',
  violet: '#9b8cf2',
  green: '#5fd068',
};

export interface RankCardData {
  name: string;
  /** PNG or JPEG as a data URI; null draws the initial instead. */
  avatar: string | null;
  level: number;
  rank: number | null;
  xp: number;
  current: number;
  needed: number;
  messages: number;
  color: RankColor;
  labels: { level: string; rank: string; xp: string; messages: string; max: string };
}

const W = 1000;
const H = 300;

const escape = (text: string): string => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Cuts long names so they never run into the level block. */
function fit(text: string, max: number): string {
  const chars = [...text];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : text;
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
  const accent = RANK_COLOR_HEX[data.color];
  const maxed = data.needed === 0;
  const ratio = maxed ? 1 : Math.min(1, Math.max(0, data.current / data.needed));
  const bar = { x: 300, y: 196, w: 640, h: 30 };
  const fill = Math.max(bar.h, Math.round(bar.w * ratio));
  const initial = escape([...data.name.trim()][0]?.toUpperCase() ?? '?');
  const progress = maxed
    ? data.labels.max
    : `${formatNumber(data.current)} / ${formatNumber(data.needed)} ${data.labels.xp}`;

  const avatar = data.avatar
    ? `<image href="${data.avatar}" x="50" y="50" width="200" height="200" clip-path="url(#round)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="150" cy="150" r="100" fill="#1a1e23"/>
       <text x="150" y="182" font-size="92" font-weight="700" fill="${accent}" text-anchor="middle">${initial}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Chakra Petch">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0 H0 V24" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
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
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect width="8" height="${H}" fill="${accent}"/>
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="17" fill="none" stroke="#2c333b" stroke-width="2"/>
  ${brackets(accent)}

  <circle cx="150" cy="150" r="108" fill="none" stroke="${accent}" stroke-width="4"/>
  <circle cx="150" cy="150" r="116" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="6 8"/>
  ${avatar}

  <text x="300" y="${maxed ? 150 : 140}" font-size="46" font-weight="700" fill="#eef2f5">${escape(fit(data.name, 16))}</text>

  <g text-anchor="end">
    <text x="940" y="86" font-size="22" font-weight="500" fill="#8a949e" letter-spacing="3">${escape(data.labels.level.toUpperCase())}</text>
    <text x="940" y="140" font-size="64" font-weight="700" fill="${accent}">${data.level}</text>
    <text x="${940 - 24 - String(data.level).length * 38}" y="140" font-size="40" font-weight="700" fill="#eef2f5">${data.rank ? `#${data.rank}` : ''}</text>
    <text x="${940 - 24 - String(data.level).length * 38}" y="86" font-size="22" font-weight="500" fill="#8a949e" letter-spacing="3">${data.rank ? escape(data.labels.rank.toUpperCase()) : ''}</text>
  </g>

  <text x="940" y="182" font-size="22" font-weight="500" fill="#c2c9d1" text-anchor="end">${escape(progress)}</text>
  <rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${bar.h}" rx="${bar.h / 2}" fill="#1a1e23" stroke="#2c333b" stroke-width="2"/>
  <rect x="${bar.x}" y="${bar.y}" width="${fill}" height="${bar.h}" rx="${bar.h / 2}" fill="url(#fill)"/>

  <text x="300" y="262" font-size="20" font-weight="500" fill="#8a949e" letter-spacing="2">${escape(
    `${formatNumber(data.xp)} ${data.labels.xp.toUpperCase()}  ·  ${formatNumber(data.messages)} ${data.labels.messages.toUpperCase()}`,
  )}</text>
  <text x="940" y="262" font-size="20" font-weight="700" fill="${accent}" fill-opacity="0.8" text-anchor="end" letter-spacing="4">MONOLITH</text>
</svg>`;
}
