/**
 * iLoveAPI task runner.
 *
 * Implements the 5-phase lifecycle (start, upload, process, download, done)
 * against the official `@ilovepdf/ilovepdf-nodejs` SDK, emitting progress
 * updates at each boundary and normalizing SDK errors to `PdfToolkitError`.
 */

import { getClient } from './client.js';
import { mapIloveApiError } from './errors.js';
import type {
  ProgressCallback,
  ProgressUpdate,
  RunTaskOptions,
  RunTaskResult,
} from './types.js';

/** No-op progress callback used when the caller doesn't provide one. */
const noopProgress: ProgressCallback = () => {};

/**
 * Run a complete iLoveAPI task lifecycle:
 *  1. start — create task on iLoveAPI and acquire a worker server
 *  2. upload — push each input file (progress scales 10% -> 40%)
 *  3. process — run the tool with the given params
 *  4. download — fetch the result buffer
 *  5. done — emit 100%
 *
 * All SDK errors are routed through `mapIloveApiError` so callers always
 * receive a `PdfToolkitError` with a stable machine-readable `code`.
 */
export async function runTask(options: RunTaskOptions): Promise<RunTaskResult> {
  const { tool, files, params = {}, outputFileName, onProgress } = options;
  const emit: ProgressCallback = onProgress ?? noopProgress;

  try {
    const api = getClient();

    const startUpdate: ProgressUpdate = {
      phase: 'start',
      percent: 10,
      message: `Starting ${tool} task...`,
    };
    emit(startUpdate);

    // The SDK's `newTask` accepts the iLoveAPI tool name string.
    // We cast here because the SDK's public typings expose a narrower
    // literal union that doesn't track new tools as fast as iLoveAPI adds them.
    const task = api.newTask(tool as Parameters<typeof api.newTask>[0]);
    await task.start();

    // Upload files one by one; scale progress from 10% -> 40% across uploads.
    const total = files.length;
    for (let i = 0; i < total; i++) {
      const filePath = files[i];
      await task.addFile(filePath);
      const pct = total > 0 ? 10 + Math.floor(((i + 1) / total) * 30) : 40;
      emit({
        phase: 'upload',
        percent: pct,
        message: `Uploaded file ${i + 1}/${total}`,
      });
    }

    emit({
      phase: 'process',
      percent: 50,
      message: 'Processing on iLoveAPI...',
    });

    const processParams: Record<string, unknown> = { ...params };
    if (outputFileName) {
      processParams.output_filename = outputFileName;
    }
    await task.process(processParams);

    emit({
      phase: 'download',
      percent: 90,
      message: 'Downloading result...',
    });

    const buffer: Buffer = await task.download();

    emit({
      phase: 'done',
      percent: 100,
      message: 'Complete',
    });

    // The SDK stores the server-assigned task id on the task instance;
    // its typings don't publicly expose it, so we read it through a narrow cast.
    const taskIdHolder = task as unknown as { taskId?: string };
    const taskId = typeof taskIdHolder.taskId === 'string' ? taskIdHolder.taskId : undefined;

    return {
      outputBuffers: [buffer],
      taskId,
      tool,
    };
  } catch (err) {
    throw mapIloveApiError(err, { tool: options.tool });
  }
}
