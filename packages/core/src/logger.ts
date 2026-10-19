type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const COLORS: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child(name: string): Logger;
}

function threshold(): number {
  const level = (process.env.LOG_LEVEL ?? 'info') as Level;
  return LEVELS[level] ?? LEVELS.info;
}

function write(level: Level, scope: string, args: unknown[]): void {
  if (LEVELS[level] < threshold()) return;
  const time = new Date().toISOString().slice(11, 19);
  const tag = level.toUpperCase().padEnd(5);
  const prefix = process.stdout.isTTY
    ? `${COLORS[level]}${time} ${tag}${RESET} [${scope}]`
    : `${time} ${tag} [${scope}]`;
  (level === 'error' || level === 'warn' ? console.error : console.log)(prefix, ...args);
}

export function createLogger(scope = 'app'): Logger {
  return {
    debug: (...args) => write('debug', scope, args),
    info: (...args) => write('info', scope, args),
    warn: (...args) => write('warn', scope, args),
    error: (...args) => write('error', scope, args),
    child: (name) => createLogger(`${scope}:${name}`),
  };
}

export const logger = createLogger();
