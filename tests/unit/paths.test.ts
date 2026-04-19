import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('paths', () => {
  let tmpDir: string;
  let pdfPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-toolkit-test-'));
    pdfPath = path.join(tmpDir, 'test.pdf');
    await fs.writeFile(pdfPath, Buffer.from('%PDF-1.4\n%EOF\n'));
    delete process.env.ILOVEAPI_SANDBOX_ROOT;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.ILOVEAPI_SANDBOX_ROOT;
  });

  it('resolveInputs: empty array throws', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    await expect(resolveInputs([], ['.pdf'])).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('resolveInputs: nonexistent file throws', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    await expect(
      resolveInputs([path.join(tmpDir, 'nope.pdf')], ['.pdf']),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('resolveInputs: wrong extension throws', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    const other = path.join(tmpDir, 'file.txt');
    await fs.writeFile(other, 'x');
    await expect(resolveInputs([other], ['.pdf'])).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });

  it('resolveInputs: happy path returns absolute', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    const res = await resolveInputs([pdfPath], ['.pdf']);
    expect(res).toHaveLength(1);
    expect(path.isAbsolute(res[0])).toBe(true);
    expect(res[0]).toBe(path.resolve(pdfPath));
  });

  it('resolveInputs: accepts relative path against cwd', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    // Vitest workers don't allow process.chdir(); instead, we drop a fixture
    // into the actual CWD, resolve it by bare filename, then clean it up.
    const cwd = process.cwd();
    const relName = `pdf-toolkit-cwd-${Date.now()}.pdf`;
    const target = path.join(cwd, relName);
    await fs.writeFile(target, '%PDF-1.4\n%%EOF\n');
    try {
      const res = await resolveInputs([relName], ['.pdf']);
      expect(res[0]).toBe(path.resolve(cwd, relName));
    } finally {
      await fs.rm(target, { force: true });
    }
  });

  it('resolveInputs: sandbox violation throws PATH_TRAVERSAL', async () => {
    const { resolveInputs } = await import('../../src/util/paths.js');
    const otherDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-toolkit-sandbox-'));
    process.env.ILOVEAPI_SANDBOX_ROOT = otherDir;
    try {
      await expect(resolveInputs([pdfPath], ['.pdf'])).rejects.toMatchObject({
        code: 'PATH_TRAVERSAL',
      });
    } finally {
      await fs.rm(otherDir, { recursive: true, force: true });
    }
  });

  it('resolveOutput: no override uses input dir with stamp', async () => {
    const { resolveOutput } = await import('../../src/util/paths.js');
    const out = resolveOutput(undefined, pdfPath, 'merged', 'pdf');
    expect(path.dirname(out)).toBe(path.dirname(pdfPath));
    expect(out).toMatch(/merged-\d{8}-\d{6}\.pdf$/);
  });

  it('resolveOutput: full-path override used as-is', async () => {
    const { resolveOutput } = await import('../../src/util/paths.js');
    const target = path.join(tmpDir, 'custom.pdf');
    const out = resolveOutput(target, pdfPath, 'merged', 'pdf');
    expect(out).toBe(path.resolve(target));
  });

  it('resolveOutput: directory override appends stamped name', async () => {
    const { resolveOutput } = await import('../../src/util/paths.js');
    const out = resolveOutput(tmpDir, pdfPath, 'merged', 'pdf');
    expect(path.dirname(out)).toBe(path.resolve(tmpDir));
    expect(out).toMatch(/merged-\d{8}-\d{6}\.pdf$/);
  });
});
