import type { ProgressCallback, ProgressUpdate } from '../api/types.js';

export function createProgressAdapter(
  send?: (pct: number, msg: string) => void,
): ProgressCallback {
  if (!send) return () => {};
  return (u: ProgressUpdate) => {
    try {
      send(u.percent, u.message);
    } catch {
      // swallow — never let progress errors crash the task
    }
  };
}
