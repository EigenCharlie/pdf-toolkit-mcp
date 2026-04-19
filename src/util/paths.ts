import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PdfToolkitError } from '../api/types.js';

export function isUnderSandbox(resolvedPath: string): boolean {
  const root = process.env.ILOVEAPI_SANDBOX_ROOT;
  if (!root) return true;
  const rootAbs = path.resolve(root);
  const rel = path.relative(rootAbs, resolvedPath);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

export async function resolveInputs(
  paths: string[],
  allowedExts: string[],
): Promise<string[]> {
  if (!paths || paths.length === 0) {
    throw new PdfToolkitError('No input paths provided', 'INVALID_INPUT', {
      allowedExts,
    });
  }
  const allowedLower = allowedExts.map((e) => e.toLowerCase());
  const resolved: string[] = [];
  for (const p of paths) {
    if (typeof p !== 'string' || !p.trim()) {
      throw new PdfToolkitError('Input path is empty', 'INVALID_INPUT', {
        path: p,
      });
    }
    const abs = path.resolve(process.cwd(), p);
    if (!isUnderSandbox(abs)) {
      throw new PdfToolkitError(
        `Path outside sandbox root: ${abs}`,
        'PATH_TRAVERSAL',
        { path: abs, sandbox: process.env.ILOVEAPI_SANDBOX_ROOT },
      );
    }
    const ext = path.extname(abs).toLowerCase();
    if (!allowedLower.includes(ext)) {
      throw new PdfToolkitError(
        `Unsupported extension "${ext}" for ${abs}. Allowed: ${allowedExts.join(', ')}`,
        'INVALID_INPUT',
        { path: abs, ext, allowed: allowedExts },
      );
    }
    try {
      const st = await fs.stat(abs);
      if (!st.isFile()) {
        throw new PdfToolkitError(`Not a file: ${abs}`, 'INVALID_INPUT', {
          path: abs,
        });
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new PdfToolkitError(`File not found: ${abs}`, 'INVALID_INPUT', {
          path: abs,
        });
      }
      throw err;
    }
    resolved.push(abs);
  }
  return resolved;
}

export function resolveOutput(
  overridePath: string | undefined,
  firstInput: string,
  operation: string,
  ext: string,
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  const baseName = path.basename(firstInput, path.extname(firstInput));
  let resolved: string;
  if (overridePath) {
    const abs = path.resolve(process.cwd(), overridePath);
    if (path.extname(abs).toLowerCase() === `.${cleanExt.toLowerCase()}`) {
      resolved = abs;
    } else {
      resolved = path.join(
        abs,
        `${baseName}-${operation}-${stamp}.${cleanExt}`,
      );
    }
  } else {
    resolved = path.join(
      path.dirname(firstInput),
      `${baseName}-${operation}-${stamp}.${cleanExt}`,
    );
  }
  if (!isUnderSandbox(resolved)) {
    throw new PdfToolkitError(
      `Output path outside sandbox: ${resolved}`,
      'PATH_TRAVERSAL',
      { path: resolved, sandbox: process.env.ILOVEAPI_SANDBOX_ROOT },
    );
  }
  return resolved;
}
