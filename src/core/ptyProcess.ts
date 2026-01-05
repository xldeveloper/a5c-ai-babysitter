import { spawn } from 'child_process';
import * as path from 'path';

import * as pty from 'node-pty';

export type PtyExitEvent = { exitCode: number; signal: number };

export type PtyProcess = {
  pid: number;
  write: (data: string) => void;
  onData: (handler: (data: string) => void) => () => void;
  onExit: (handler: (event: PtyExitEvent) => void) => () => void;
  kill: () => void;
  /**
   * Removes listeners but does not terminate the underlying process.
   * Useful when the extension is deactivating and should not implicitly kill `o`.
   */
  detach: () => void;
  dispose: () => void;
};

export type SpawnPtyOptions = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  cols?: number;
  rows?: number;
  name?: string;
};

function isWindowsCmdScript(filePath: string, platform: NodeJS.Platform): boolean {
  if (platform !== 'win32') return false;
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.cmd' || ext === '.bat';
}

function spawnStdioProcess(filePath: string, args: string[], options: SpawnPtyOptions): PtyProcess {
  const child = spawn(filePath, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    // Use the system shell so `.cmd` / `.bat` wrappers run correctly on Windows.
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  const stdoutListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  const stderrListener = (chunk: string): void => {
    for (const handler of dataHandlers) handler(chunk);
  };
  child.stdout.on('data', stdoutListener);
  child.stderr.on('data', stderrListener);

  const exitListener = (code: number | null, signal: NodeJS.Signals | null): void => {
    for (const handler of exitHandlers) handler({ exitCode: code ?? 0, signal: signal ? 1 : 0 });
  };
  child.on('exit', exitListener);

  let disposed = false;
  const detach = (): void => {
    if (disposed) return;
    disposed = true;
    dataHandlers.clear();
    exitHandlers.clear();
    child.stdout.off('data', stdoutListener);
    child.stderr.off('data', stderrListener);
    child.off('exit', exitListener);
  };

  return {
    pid: child.pid ?? -1,
    write: (data: string) => {
      if (disposed) return;
      child.stdin.write(data);
    },
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => {
      if (disposed) return;
      child.kill();
    },
    detach,
    dispose: () => {
      detach();
      try {
        child.kill();
      } catch {
        // ignore
      }
    },
  };
}

export function spawnPtyProcess(
  filePath: string,
  args: string[],
  options: SpawnPtyOptions,
): PtyProcess {
  if (isWindowsCmdScript(filePath, process.platform)) {
    return spawnStdioProcess(filePath, args, options);
  }

  const ptyProcess = pty.spawn(filePath, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    cols: options.cols ?? 120,
    rows: options.rows ?? 30,
    name: options.name ?? 'xterm-256color',
  });

  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();

  const dataDisposable = ptyProcess.onData((data) => {
    for (const handler of dataHandlers) handler(data);
  });
  let exited = false;
  const exitDisposable = ptyProcess.onExit((event) => {
    exited = true;
    for (const handler of exitHandlers)
      handler({ exitCode: event.exitCode, signal: event.signal ?? 0 });
  });

  let disposed = false;
  const detach = (): void => {
    if (disposed) return;
    disposed = true;
    dataHandlers.clear();
    exitHandlers.clear();
    dataDisposable.dispose();
    exitDisposable.dispose();
  };

  return {
    pid: ptyProcess.pid,
    write: (data: string) => {
      if (disposed) return;
      ptyProcess.write(data);
    },
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => {
      if (disposed) return;
      ptyProcess.kill();
    },
    detach,
    dispose: () => {
      detach();
      if (exited) return;
      try {
        ptyProcess.kill();
      } catch {
        // ignore
      }
    },
  };
}
