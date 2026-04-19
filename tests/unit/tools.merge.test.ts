import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

vi.mock('../../src/api/tasks.js', () => ({
  runTask: vi.fn(async (opts: { tool: string }) => ({
    outputBuffers: [Buffer.from('%PDF-1.4 merged output\n')],
    taskId: 'task-abc',
    tool: opts.tool,
  })),
}));

describe('merge_pdf tool', () => {
  let tmpDir: string;
  let a: string;
  let b: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-toolkit-merge-'));
    a = path.join(tmpDir, 'a.pdf');
    b = path.join(tmpDir, 'b.pdf');
    await fs.writeFile(a, Buffer.from('%PDF-1.4\na\n'));
    await fs.writeFile(b, Buffer.from('%PDF-1.4\nb\n'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('rejects fewer than 2 input_files via Zod', async () => {
    const { mergeTool } = await import('../../src/tools/merge.js');
    const parsed = mergeTool.inputSchema.safeParse({ input_files: [a] });
    expect(parsed.success).toBe(false);
  });

  it('merges two PDFs and writes output', async () => {
    const { mergeTool } = await import('../../src/tools/merge.js');
    const { runTask } = await import('../../src/api/tasks.js');
    const res = await mergeTool.handler(
      { input_files: [a, b] },
      { sendProgress: () => {} },
    );
    expect(res.content.some((c) => c.type === 'text')).toBe(true);
    const resource = res.content.find((c) => c.type === 'resource');
    expect(resource).toBeDefined();
    if (resource && resource.type === 'resource') {
      expect(resource.resource.uri.startsWith('file:///')).toBe(true);
      expect(resource.resource.mimeType).toBe('application/pdf');
    }
    expect(runTask).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: 'merge',
        files: expect.arrayContaining([path.resolve(a), path.resolve(b)]),
      }),
    );
  });

  it('writes output file to disk', async () => {
    const { mergeTool } = await import('../../src/tools/merge.js');
    const outputTarget = path.join(tmpDir, 'result.pdf');
    await mergeTool.handler(
      { input_files: [a, b], output_path: outputTarget },
      {},
    );
    const written = await fs.readFile(outputTarget);
    expect(written.toString()).toContain('merged output');
  });
});
