/**
 * iLoveAPI client factory.
 *
 * Reads credentials from environment variables and returns a cached
 * `ILovePDFApi` instance. The SDK handles JWT signing and HTTP for us.
 *
 * Required env vars:
 *   - ILOVEAPI_PROJECT_PUBLIC_KEY
 *   - ILOVEAPI_PROJECT_SECRET_KEY
 *
 * Get them at https://developer.ilovepdf.com
 */

import { createRequire } from 'node:module';
import { PdfToolkitError, type IloveApiCredentials } from './types.js';

// The SDK ships as CJS with `module.exports = class ILovePDFApi`. That
// assignment pattern doesn't round-trip through NodeNext's ESM default-import
// interop, so we use `createRequire` to grab the class constructor directly.
// The shape below matches the subset of the SDK surface we actually use in
// `runTask` — we deliberately avoid the SDK's d.ts to sidestep the interop.
export interface IloveTask {
  start: () => Promise<unknown>;
  addFile: (filePath: string) => Promise<unknown>;
  process: (params?: Record<string, unknown>) => Promise<unknown>;
  download: () => Promise<Buffer>;
}

export interface IloveClient {
  newTask: (toolName: string) => IloveTask;
}

type IloveClientCtor = new (publicKey: string, secretKey: string) => IloveClient;

const requireCjs = createRequire(import.meta.url);
const ILovePDFApi = requireCjs('@ilovepdf/ilovepdf-nodejs') as IloveClientCtor;

/**
 * Read iLoveAPI credentials from process env.
 * Throws `PdfToolkitError` with code `MISSING_CREDENTIALS` if either var is absent.
 */
export function loadCredentials(): IloveApiCredentials {
  const publicKey = process.env.ILOVEAPI_PROJECT_PUBLIC_KEY;
  const secretKey = process.env.ILOVEAPI_PROJECT_SECRET_KEY;
  if (!publicKey || !secretKey) {
    throw new PdfToolkitError(
      'Missing iLoveAPI credentials. Set ILOVEAPI_PROJECT_PUBLIC_KEY and ILOVEAPI_PROJECT_SECRET_KEY env vars. Get them at https://developer.ilovepdf.com',
      'MISSING_CREDENTIALS',
    );
  }
  return { publicKey, secretKey };
}

let cachedClient: IloveClient | null = null;

/**
 * Return a singleton `ILovePDFApi` instance, creating it on first call.
 * The SDK is safe to reuse across tasks — it manages auth tokens internally.
 */
export function getClient(): IloveClient {
  if (!cachedClient) {
    const { publicKey, secretKey } = loadCredentials();
    cachedClient = new ILovePDFApi(publicKey, secretKey);
  }
  return cachedClient;
}

/** Test-only: reset cached client (useful for unit tests). */
export function _resetClient(): void {
  cachedClient = null;
}
