import { formatDuration, formatNumber } from '@monolith/core/browser';
import { lang } from '../i18n/index.ts';

export { formatDuration, formatNumber };

// Short scales: Spanish says "mil millones" where English says "billion".
const SCALES: Record<string, [number, string][]> = {
  en: [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
  ],
  es: [
    [1e12, ' B'],
    [1e9, ' mil M'],
    [1e6, ' M'],
  ],
};

/** 2,775,276,526 → "2.78B" (en) / "2,78 mil M" (es); exact below one million. */
export function compactNumber(value: number): string {
  if (Math.abs(value) < 1_000_000) return formatNumber(value);
  const scales = SCALES[lang.value] ?? SCALES.en!;
  const [size, suffix] = scales.find(([limit]) => Math.abs(value) >= limit)!;
  const amount = new Intl.NumberFormat(lang.value, { maximumFractionDigits: 2 }).format(
    value / size,
  );
  return `${amount}${suffix}`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

/** "in 3 hours", "hace 2 días"... */
export function relativeTime(timestamp: number): string {
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat(lang.value, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === 'second') {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return '';
}

export const dateTime = (timestamp: number): string =>
  new Intl.DateTimeFormat(lang.value, { dateStyle: 'medium', timeStyle: 'short' }).format(
    timestamp,
  );

export const guildIcon = (guild: { id: string; icon: string | null }, size = 128): string | null =>
  guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}` : null;

export const userAvatar = (
  user: { id: string; avatar: string | null },
  size = 64,
): string | null =>
  user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`
    : null;

/** Initials for servers or members without a picture. */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('') || '?';

/** Discord role colour as CSS (0 means "no colour"). */
export const roleColor = (color: number): string =>
  color ? `#${color.toString(16).padStart(6, '0')}` : 'var(--p-text-muted-color)';
