import * as path from 'path';

export function isRunId(dirName: string): boolean {
  return true;
}

/**
 * Extracts the run id (`20260105-010206-anything`) from an absolute path that is
 * expected to be inside the runs root.
 *
 * Examples:
 * - runsRoot=/x/.a5c/runs, fsPath=/x/.a5c/runs/20260105-010206-anything/state.json -> 20260105-010206-anything
 * - runsRoot=/x/.a5c/runs, fsPath=/x/.a5c/runs -> undefined
 * - runsRoot=/x/.a5c/runs, fsPath=/x/other -> undefined
 */
export function extractRunIdFromPath(runsRootPath: string, fsPath: string): string | undefined {
  const relative = path.relative(runsRootPath, fsPath);
  if (relative === '' || relative === '.') return undefined;
  if (relative.startsWith('..') || path.isAbsolute(relative)) return undefined;
  const firstSegment = relative.split(path.sep)[0];
  if (!firstSegment || firstSegment === '.' || firstSegment === '..') return undefined;
  return isRunId(firstSegment) ? firstSegment : undefined;
}
