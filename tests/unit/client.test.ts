import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ilovepdf/ilovepdf-nodejs', () => ({
  default: vi.fn().mockImplementation((pub: string, sec: string) => ({
    publicKey: pub,
    secretKey: sec,
    newTask: vi.fn(),
  })),
}));

describe('client', () => {
  beforeEach(async () => {
    const mod = await import('../../src/api/client.js');
    mod._resetClient();
    delete process.env.ILOVEAPI_PROJECT_PUBLIC_KEY;
    delete process.env.ILOVEAPI_PROJECT_SECRET_KEY;
  });

  it('throws MISSING_CREDENTIALS when public key is missing', async () => {
    const { loadCredentials } = await import('../../src/api/client.js');
    process.env.ILOVEAPI_PROJECT_SECRET_KEY = 'sec';
    expect(() => loadCredentials()).toThrowError(/Missing iLoveAPI credentials/);
  });

  it('throws when secret key is missing', async () => {
    const { loadCredentials } = await import('../../src/api/client.js');
    process.env.ILOVEAPI_PROJECT_PUBLIC_KEY = 'pub';
    expect(() => loadCredentials()).toThrow();
  });

  it('returns credentials when both keys are set', async () => {
    const { loadCredentials } = await import('../../src/api/client.js');
    process.env.ILOVEAPI_PROJECT_PUBLIC_KEY = 'pub';
    process.env.ILOVEAPI_PROJECT_SECRET_KEY = 'sec';
    expect(loadCredentials()).toEqual({ publicKey: 'pub', secretKey: 'sec' });
  });

  it('getClient caches instance', async () => {
    const { getClient } = await import('../../src/api/client.js');
    process.env.ILOVEAPI_PROJECT_PUBLIC_KEY = 'pub';
    process.env.ILOVEAPI_PROJECT_SECRET_KEY = 'sec';
    const c1 = getClient();
    const c2 = getClient();
    expect(c1).toBe(c2);
  });
});
