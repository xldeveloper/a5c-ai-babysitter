import * as path from 'path';
import { fileURLToPath } from 'url';

import { isFsPathInsideRoot } from '../core/runDetailsSnapshot';

export type PromptBuilderPersistedState = {
  selectedId: string;
  request: string;
  attachments: string[];
  paramValues: Record<string, string>;
};

export type PromptBuilderMementoLike = {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Thenable<void> | void;
};

export type PromptBuilderWebviewLike = {
  postMessage(message: unknown): Thenable<boolean> | boolean;
};

const STATE_KEY = 'babysitter.promptBuilder.state';

export function parseDroppedText(raw: string): string[] {
  return (raw || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'));
}

function looksLikeUri(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value);
}

function tryFsPathFromDropItem(item: string): { fsPath: string; link?: string } | undefined {
  const trimmed = item.trim();
  if (!trimmed) return undefined;

  if (looksLikeUri(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'file:') {
        return { fsPath: fileURLToPath(url), link: trimmed };
      }
      if (url.protocol === 'vscode-file:') {
        // VS Code sometimes emits vscode-file:// URIs for drag/drop; treat the pathname as a file path.
        const decodedPath = decodeURIComponent(url.pathname);
        if (decodedPath.startsWith('/') && /^[a-zA-Z]:\//.test(decodedPath.slice(1))) {
          return { fsPath: decodedPath.slice(1).replaceAll('/', path.sep), link: trimmed };
        }
        return { fsPath: decodedPath.replaceAll('/', path.sep), link: trimmed };
      }
      return { fsPath: trimmed, link: trimmed };
    } catch {
      return { fsPath: trimmed, link: trimmed };
    }
  }

  if (path.isAbsolute(trimmed)) return { fsPath: trimmed };
  return undefined;
}

export function normalizeDropItemsToAttachmentRefs(
  items: readonly string[],
  workspaceRoot: string,
): string[] {
  const normalizedRoot = path.resolve(workspaceRoot);
  const out: string[] = [];
  for (const item of items) {
    const resolved = tryFsPathFromDropItem(item);
    if (!resolved) continue;

    if (
      resolved.link &&
      !resolved.link.startsWith('file:') &&
      !resolved.link.startsWith('vscode-file:')
    ) {
      if (!out.includes(resolved.link)) out.push(resolved.link);
      continue;
    }

    const candidateFsPath = path.resolve(resolved.fsPath);
    if (isFsPathInsideRoot(normalizedRoot, candidateFsPath)) {
      const rel = path.relative(normalizedRoot, candidateFsPath);
      const relPosix = rel.split(path.sep).join('/');
      if (relPosix && !out.includes(relPosix)) out.push(relPosix);
      continue;
    }

    if (resolved.link) {
      if (!out.includes(resolved.link)) out.push(resolved.link);
    } else {
      if (!out.includes(candidateFsPath)) out.push(candidateFsPath);
    }
  }
  return out;
}

export function sanitizePersistedState(raw: unknown): PromptBuilderPersistedState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;

  const selectedId = typeof obj.selectedId === 'string' ? obj.selectedId : '';
  const request = typeof obj.request === 'string' ? obj.request : '';
  const attachments = Array.isArray(obj.attachments)
    ? obj.attachments.filter((x): x is string => typeof x === 'string')
    : [];
  const paramValuesRaw =
    obj.paramValues && typeof obj.paramValues === 'object'
      ? (obj.paramValues as Record<string, unknown>)
      : {};
  const paramValues: Record<string, string> = {};
  for (const [k, v] of Object.entries(paramValuesRaw)) {
    if (typeof v === 'string') paramValues[k] = v;
  }

  return { selectedId, request, attachments, paramValues };
}

export function mergeUniqueStrings(
  existing: readonly string[],
  incoming: readonly string[],
): string[] {
  const out = existing.slice();
  for (const item of incoming) {
    if (typeof item !== 'string') continue;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

export class PromptBuilderBridge {
  constructor(
    private readonly deps: {
      webview: PromptBuilderWebviewLike;
      workspaceRoot: string;
      memento?: PromptBuilderMementoLike;
    },
  ) {}

  async hydrate(): Promise<void> {
    const saved = this.deps.memento?.get<unknown>(STATE_KEY);
    const sanitized = sanitizePersistedState(saved);
    if (!sanitized) return;
    await Promise.resolve(this.deps.webview.postMessage({ type: 'hydrate', state: sanitized }));
  }

  async handleMessage(msg: unknown): Promise<boolean> {
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return false;
    const typed = msg as { type: string; [key: string]: unknown };

    // Prompt preview is a webview-side UX affordance. Keep it in the bridge so
    // callers can opt-in without needing extension-specific command plumbing.
    if (typed.type === 'previewPrompt' || typed.type === 'previewDispatch') {
      const raw =
        typeof typed.text === 'string'
          ? typed.text
          : typeof typed.prompt === 'string'
            ? typed.prompt
            : '';
      const text = raw.trim();
      if (!text) {
        await Promise.resolve(this.deps.webview.postMessage({ type: 'status', text: 'Prompt is empty.' }));
        return true;
      }
      const responseType = typed.type === 'previewDispatch' ? 'dispatchPreview' : 'promptPreview';
      await Promise.resolve(this.deps.webview.postMessage({ type: responseType, text }));
      return true;
    }

    if (typed.type === 'drop') {
      const raw = typeof typed.text === 'string' ? typed.text : '';
      const items = parseDroppedText(raw);
      const normalized = normalizeDropItemsToAttachmentRefs(items, this.deps.workspaceRoot);
      if (normalized.length === 0) return true;
      await Promise.resolve(
        this.deps.webview.postMessage({ type: 'attachmentsMerged', items: normalized }),
      );
      return true;
    }

    if (typed.type === 'persist') {
      const sanitized = sanitizePersistedState(typed.state);
      if (!sanitized) return true;
      await Promise.resolve(this.deps.memento?.update(STATE_KEY, sanitized));
      return true;
    }

    return false;
  }
}
