#!/usr/bin/env node
/**
 * Build an MCPB bundle (.mcpb) for Claude Desktop / any MCPB-compatible host.
 *
 * What it does:
 *   1. Reads `package.json` to get the version.
 *   2. Creates a clean `.mcpb-stage/` staging directory with only production artifacts.
 *   3. Runs `npm install --omit=dev --ignore-scripts` inside the stage.
 *   4. Delegates to `mcpb pack` to produce `pdf-toolkit-mcp-<version>.mcpb`.
 *   5. Removes the staging directory.
 *
 * Usage: `npm run build:mcpb`
 * Requires: `npm run build` has been run first (so `dist/` exists).
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STAGE = join(PROJECT_ROOT, '.mcpb-stage');
const DIST = join(PROJECT_ROOT, 'dist');

const pkg = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
const bundleName = `pdf-toolkit-mcp-${version}.mcpb`;

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

console.error(`[build:mcpb] staging at ${STAGE}`);
rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });

for (const rel of ['dist', 'manifest.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'package.json', 'package-lock.json']) {
  const src = join(PROJECT_ROOT, rel);
  const dst = join(STAGE, rel);
  if (existsSync(src)) cpSync(src, dst, { recursive: true });
}

console.error('[build:mcpb] installing production deps in stage…');
execSync('npm install --omit=dev --ignore-scripts', { cwd: STAGE, stdio: 'inherit' });

console.error(`[build:mcpb] packing ${bundleName}…`);
execSync(`npx --no-install mcpb pack "${STAGE}" "${bundleName}"`, { cwd: PROJECT_ROOT, stdio: 'inherit' });

console.error('[build:mcpb] cleaning up stage…');
rmSync(STAGE, { recursive: true, force: true });

console.error(`[build:mcpb] done → ${join(PROJECT_ROOT, bundleName)}`);
