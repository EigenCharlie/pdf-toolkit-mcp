import { beforeAll, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const hasCreds =
  !!process.env.ILOVEAPI_PROJECT_PUBLIC_KEY && !!process.env.ILOVEAPI_PROJECT_SECRET_KEY;

const MIN_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj\n' +
    'xref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000104 00000 n \n' +
    'trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n',
);

describe.skipIf(!hasCreds)('smoke: real iLoveAPI merge', () => {
  let tmpDir: string;
  let a: string;
  let b: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-toolkit-smoke-'));
    a = path.join(tmpDir, 'a.pdf');
    b = path.join(tmpDir, 'b.pdf');
    await fs.writeFile(a, MIN_PDF);
    await fs.writeFile(b, MIN_PDF);
  });

  it('merges two PDFs via real API', async () => {
    const { mergeTool } = await import('../../src/tools/merge.js');
    const outPath = path.join(tmpDir, 'merged.pdf');
    const res = await mergeTool.handler(
      { input_files: [a, b], output_path: outPath },
      {},
    );
    expect(res.isError).toBeFalsy();
    const out = await fs.readFile(outPath);
    expect(out.length).toBeGreaterThan(100);
    expect(out.subarray(0, 5).toString()).toBe('%PDF-');
  }, 60_000);
});
