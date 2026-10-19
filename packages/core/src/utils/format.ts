const numberFormat = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Human readable duration: 90 → "1m 30s", 86400 → "1d". */
export function formatDuration(totalSeconds: number): string {
  let seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds === 0) return '0s';
  const units: [string, number][] = [
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ];
  const parts: string[] = [];
  for (const [label, size] of units) {
    const amount = Math.floor(seconds / size);
    if (amount > 0) {
      parts.push(`${amount}${label}`);
      seconds -= amount * size;
    }
  }
  return parts.join(' ');
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
