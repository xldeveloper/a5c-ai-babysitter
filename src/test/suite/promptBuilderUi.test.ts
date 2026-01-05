import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

import * as vscode from 'vscode';

import {
  PromptBuilderBridge,
  type PromptBuilderMementoLike,
  type PromptBuilderWebviewLike,
} from '../../extension/promptBuilderBridge';

class MemoryMemento implements PromptBuilderMementoLike {
  private readonly store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  update(key: string, value: unknown): void {
    this.store.set(key, value);
  }
}

function makeWebview(): { webview: PromptBuilderWebviewLike; messages: unknown[] } {
  const messages: unknown[] = [];
  return {
    messages,
    webview: {
      postMessage: (message: unknown) => {
        messages.push(message);
        return true;
      },
    },
  };
}

suite('Prompt Builder UI bridge', () => {
  test('hydrates persisted state on ready', async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(workspaceRoot, 'test workspace not opened');

    const memento = new MemoryMemento();
    const { webview, messages } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot, memento });

    await bridge.handleMessage({
      type: 'persist',
      state: {
        selectedId: 'proc#x',
        request: 'hello',
        attachments: ['requirements.md'],
        paramValues: { domain: 'frontend' },
      },
    });

    messages.splice(0, messages.length);
    await bridge.hydrate();

    assert.strictEqual(messages.length, 1);
    assert.deepStrictEqual(messages[0], {
      type: 'hydrate',
      state: {
        selectedId: 'proc#x',
        request: 'hello',
        attachments: ['requirements.md'],
        paramValues: { domain: 'frontend' },
      },
    });
  });

  test('normalizes dropped file URIs to workspace-relative paths', async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(workspaceRoot, 'test workspace not opened');

    const memento = new MemoryMemento();
    const { webview, messages } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot, memento });

    const inside = pathToFileURL(path.join(workspaceRoot, 'requirements.md')).toString();
    const outside = pathToFileURL(path.join(os.tmpdir(), 'babysitter-drop-test.txt')).toString();

    const handled = await bridge.handleMessage({ type: 'drop', text: `${inside}\n${outside}\n` });
    assert.strictEqual(handled, true);
    assert.strictEqual(messages.length, 1);

    const msg = messages[0] as { type?: unknown; items?: unknown };
    assert.strictEqual(msg.type, 'attachmentsMerged');
    assert.deepStrictEqual(msg.items, ['requirements.md', outside]);
  });

  test('persists only the expected state shape', async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(workspaceRoot, 'test workspace not opened');

    const memento = new MemoryMemento();
    const { webview } = makeWebview();
    const bridge = new PromptBuilderBridge({ webview, workspaceRoot, memento });

    await bridge.handleMessage({
      type: 'persist',
      state: {
        selectedId: 123,
        request: 'r',
        attachments: ['a', 2, null],
        paramValues: { ok: 'yes', bad: 1 },
        extra: { nope: true },
      },
    });

    await bridge.hydrate();
    const hydrated = memento.get<{
      selectedId: unknown;
      request: unknown;
      attachments: unknown;
      paramValues: unknown;
    }>('babysitter.promptBuilder.state');
    assert.deepStrictEqual(hydrated, {
      selectedId: '',
      request: 'r',
      attachments: ['a'],
      paramValues: { ok: 'yes' },
    });
  });
});
