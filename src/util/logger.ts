type Level = 'info' | 'warn' | 'error' | 'debug';

const enabled: Record<Level, boolean> = {
  info: true,
  warn: true,
  error: true,
  debug:
    process.env.PDF_TOOLKIT_DEBUG === '1' ||
    process.env.PDF_TOOLKIT_DEBUG === 'true',
};

function fmt(level: Level, msg: string, extra?: unknown): string {
  const ts = new Date().toISOString();
  const suffix = extra !== undefined ? ` ${JSON.stringify(extra)}` : '';
  return `[${ts}] [pdf-toolkit-mcp] [${level}] ${msg}${suffix}`;
}

export const log = {
  info(msg: string, extra?: unknown): void {
    if (enabled.info) process.stderr.write(fmt('info', msg, extra) + '\n');
  },
  warn(msg: string, extra?: unknown): void {
    if (enabled.warn) process.stderr.write(fmt('warn', msg, extra) + '\n');
  },
  error(msg: string, extra?: unknown): void {
    if (enabled.error) process.stderr.write(fmt('error', msg, extra) + '\n');
  },
  debug(msg: string, extra?: unknown): void {
    if (enabled.debug) process.stderr.write(fmt('debug', msg, extra) + '\n');
  },
};
