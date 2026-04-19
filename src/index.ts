#!/usr/bin/env node
import { main } from './server.js';

main().catch((err: unknown) => {
  const detail = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`[pdf-toolkit-mcp] fatal: ${detail}\n`);
  process.exit(1);
});
