import { describe, expect, it } from 'vitest';

describe('mapIloveApiError', () => {
  it('rethrows existing PdfToolkitError unchanged', async () => {
    const { PdfToolkitError } = await import('../../src/api/types.js');
    const { mapIloveApiError } = await import('../../src/api/errors.js');
    const original = new PdfToolkitError('x', 'SOME_CODE');
    expect(mapIloveApiError(original, { tool: 'merge' })).toBe(original);
  });

  it.each([
    [400, 'INVALID_INPUT'],
    [401, 'AUTH_FAILED'],
    [402, 'PLAN_LIMIT'],
    [404, 'NOT_FOUND'],
    [429, 'RATE_LIMITED'],
    [500, 'API_ERROR'],
  ])('maps HTTP %i to %s', async (status, expected) => {
    const { mapIloveApiError } = await import('../../src/api/errors.js');
    const err = { response: { status, data: { message: 'boom' } }, message: 'x' };
    const mapped = mapIloveApiError(err, { tool: 'merge' });
    expect(mapped.code).toBe(expected);
    expect(mapped.data?.http_status).toBe(status);
    expect(mapped.data?.tool).toBe('merge');
  });

  it('detects TASK_LIMIT from name field', async () => {
    const { mapIloveApiError } = await import('../../src/api/errors.js');
    const err = {
      response: { status: 400, data: { name: 'TaskLimitReached', message: 'x' } },
    };
    const mapped = mapIloveApiError(err, { tool: 'merge' });
    expect(mapped.code).toBe('TASK_LIMIT');
  });

  it('falls back to API_ERROR when no status is present', async () => {
    const { mapIloveApiError } = await import('../../src/api/errors.js');
    const mapped = mapIloveApiError(new Error('network down'), { tool: 'merge' });
    expect(mapped.code).toBe('API_ERROR');
    expect(mapped.message).toContain('merge');
  });
});
