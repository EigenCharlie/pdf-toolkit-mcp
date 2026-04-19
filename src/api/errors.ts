/**
 * Normalize errors thrown by the iLoveAPI SDK (and underlying Axios HTTP
 * client) into stable `PdfToolkitError` instances with machine-readable
 * `code` values that the tool layer and MCP response formatter can branch on.
 */

import { PdfToolkitError } from './types.js';

/** Shape of an Axios-like error we care about (minimal, structural). */
interface AxiosLikeError {
  message?: string;
  name?: string;
  status?: number;
  response?: {
    status?: number;
    data?: {
      name?: string;
      message?: string;
      code?: number;
      param?: unknown;
    };
  };
}

/**
 * Convert any thrown value into a `PdfToolkitError`.
 *
 * If `err` is already a `PdfToolkitError` (e.g. from `loadCredentials`), it
 * is returned unchanged so upstream codes like `MISSING_CREDENTIALS` survive.
 *
 * For HTTP errors from the SDK we map common status codes to stable codes:
 *   400 -> INVALID_INPUT
 *   401 -> AUTH_FAILED
 *   402 -> PLAN_LIMIT
 *   404 -> NOT_FOUND
 *   429 -> RATE_LIMITED
 * iLoveAPI's `TaskLimit`-style error names are bumped to TASK_LIMIT.
 * Anything else becomes API_ERROR.
 */
export function mapIloveApiError(
  err: unknown,
  ctx: { tool: string; taskId?: string },
): PdfToolkitError {
  if (err instanceof PdfToolkitError) {
    return err;
  }

  const e = (err ?? {}) as AxiosLikeError;
  const status: number | undefined = e.response?.status ?? e.status;
  const iloveName: string | undefined = e.response?.data?.name ?? e.name;
  const iloveMsg: string =
    e.response?.data?.message ?? e.message ?? 'Unknown iLoveAPI error';

  const data: Record<string, unknown> = {
    iloveapi_name: iloveName,
    http_status: status,
    tool: ctx.tool,
    task_id: ctx.taskId,
  };

  let code = 'API_ERROR';
  switch (status) {
    case 400:
      code = 'INVALID_INPUT';
      break;
    case 401:
      code = 'AUTH_FAILED';
      break;
    case 402:
      code = 'PLAN_LIMIT';
      break;
    case 404:
      code = 'NOT_FOUND';
      break;
    case 429:
      code = 'RATE_LIMITED';
      break;
    default:
      code = 'API_ERROR';
      break;
  }

  // iLoveAPI surfaces the plan-level task cap via a named error regardless
  // of status, so upgrade the code if we detect it in the name field.
  if (iloveName && iloveName.toLowerCase().includes('tasklimit')) {
    code = 'TASK_LIMIT';
  }

  return new PdfToolkitError(
    `iLoveAPI ${ctx.tool} failed: ${iloveMsg}`,
    code,
    data,
  );
}
