/**
 * Shared types for the iLoveAPI wrapper layer.
 * These define the public contract between `api/`, `util/`, and `tools/`.
 */

/** iLoveAPI tool identifiers used in `POST /v1/start/{tool}`. */
export type ToolName =
  | 'merge'
  | 'split'
  | 'compress'
  | 'pdfoffice'
  | 'pdfjpg'
  | 'officepdf'
  | 'htmlpdf'
  | 'imagepdf'
  | 'rotate'
  | 'pagenumber'
  | 'watermark'
  | 'unlock'
  | 'protect'
  | 'repair'
  | 'pdfocr'
  | 'extract';

export type ProgressPhase = 'start' | 'upload' | 'process' | 'download' | 'done';

export interface ProgressUpdate {
  percent: number;
  message: string;
  phase: ProgressPhase;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

export interface RunTaskOptions {
  tool: ToolName;
  /** Absolute or already-resolved input file paths. */
  files: string[];
  /** Tool-specific params forwarded to `POST /v1/process`. */
  params?: Record<string, unknown>;
  /** Optional output filename hint sent to iLoveAPI. */
  outputFileName?: string;
  /** Invoked at each lifecycle phase (start, upload, process poll, download). */
  onProgress?: ProgressCallback;
}

export interface RunTaskResult {
  /** One Buffer per output file. Single-file tools return one entry. */
  outputBuffers: Buffer[];
  /** iLoveAPI task id for tracing/debugging. */
  taskId?: string;
  tool: ToolName;
}

export interface IloveApiCredentials {
  publicKey: string;
  secretKey: string;
}

export class PdfToolkitError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'PdfToolkitError';
  }
}
