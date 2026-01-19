# Babysitter Skill - SDK-Based Updates

**Date:** 2026-01-19
**Source:** `sdk.md` - @a5c-ai/babysitter-sdk specification

---

## Summary

Updated the babysitter skill documentation to reflect the **actual SDK API** instead of higher-level abstraction patterns. The previous version incorrectly assumed APIs from `.a5c/processes/core/` patterns (like `requireAct()`, `runQualityGate()`) were part of the core SDK.

---

## Key Corrections

### 1. Process Function Signature

**Before (WRONG):**
```javascript
export const myWorkflow = (task, ctx = {}, opts = {}) => {
  const input = normalizeTask(task);
  return runQualityGate({...});
};
```

**After (CORRECT - from SDK):**
```javascript
export async function process(inputs, ctx) {
  const result = await ctx.task(myTask, inputs);
  return result;
}
```

**Reason:** The SDK defines processes as `async function process(inputs: any, ctx: ProcessContext): Promise<any>`, not as higher-level workflow functions.

---

### 2. Task Definition

**Before (WRONG):**
```javascript
const act = requireAct(ctx);
const result = act("Do something", { ...ctx });
```

**After (CORRECT - from SDK):**
```javascript
import { defineTask } from "@a5c-ai/babysitter-sdk";

const myTask = defineTask("task-id", (args, taskCtx) => {
  return {
    kind: "node",
    title: "Task title",
    node: {
      entry: "scripts/my-task.js",
      args: ["--arg", args.value],
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
  };
});

// In process:
const result = await ctx.task(myTask, { value: "foo" });
```

**Reason:** Tasks are defined with `defineTask(id, impl)` which returns a TaskDef, not by calling abstracted helper functions.

---

### 3. SDK Intrinsics (ProcessContext API)

**Documented the actual SDK API:**

```typescript
interface ProcessContext {
  task<TArgs, TResult>(
    taskFn: DefinedTask<TArgs, TResult>,
    args: TArgs,
    options?: { label?: string }
  ): Promise<TResult>;

  breakpoint<T = any>(payload: T): Promise<void>;

  sleepUntil(isoOrEpochMs: string | number): Promise<void>;

  parallel: {
    all<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]>;
    map<TItem, TOut>(
      items: TItem[],
      fn: (item: TItem) => TOut | Promise<TOut>
    ): Promise<TOut[]>;
  };

  now(): Date;
}
```

**Key Points:**
- `ctx.task()` executes defined tasks
- `ctx.breakpoint()` requests human intervention
- `ctx.sleepUntil()` creates time gates
- `ctx.parallel.all/map()` for concurrent execution
- **NO** `ctx.note()`, `ctx.artifact()`, `ctx.develop`, or `requireAct()`

---

### 4. Parallel Execution

**Before (WRONG):**
```javascript
// Undefined API
```

**After (CORRECT - from SDK):**
```javascript
const [lintResult, testResult] = await ctx.parallel.all([
  () => ctx.task(lintTask, { files: buildResult.files }),
  () => ctx.task(testTask, { suite: "smoke" }),
]);
```

**Reason:** Parallel execution uses `ctx.parallel.all()` with **thunks** (functions that return task calls).

---

### 5. Breakpoints

**Before (WRONG):**
```javascript
// Assumed it was some special mechanism
```

**After (CORRECT - from SDK):**
```javascript
await ctx.breakpoint({
  reason: "Approval needed",
  data: { issueCount: 10 },
  question: "Proceed?"
});
```

**Reason:** Breakpoints are a first-class intrinsic, implemented as special tasks with `kind="breakpoint"`.

---

### 6. Complete Example

**Updated Section 11 Example:**

```javascript
import { defineTask } from "@a5c-ai/babysitter-sdk";

// Define tasks
const analyzeUITask = defineTask("analyze-ui", (args, taskCtx) => ({
  kind: "node",
  title: "Analyze UI components",
  node: {
    entry: "scripts/analyze-ui.js",
    args: ["--target", args.target],
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

const improveUITask = defineTask("improve-ui", (args, taskCtx) => ({
  kind: "node",
  title: "Improve UI",
  node: { entry: "scripts/improve-ui.js" },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

// Process function
export async function process(inputs, ctx) {
  // Execute tasks
  const analysis = await ctx.task(analyzeUITask, {
    target: inputs.targetComponent
  });

  // Conditional breakpoint
  if (analysis.issues.length > 0) {
    await ctx.breakpoint({
      reason: "Issues found",
      issues: analysis.issues,
      question: "Proceed with improvements?"
    });
  }

  // Continue
  const improvements = await ctx.task(improveUITask, {
    issues: analysis.issues
  });

  return {
    ok: true,
    analysis,
    improvements,
  };
}
```

---

## Clarifications Added

### Higher-Level Patterns Are Optional

Added clear distinction:

> **The `.a5c/processes/core/` directory provides optional higher-level patterns built on the SDK:**
>
> - `runQualityGate()` - Quality-gated iteration loop
> - `runTriageFixVerify()` - Triage → Fix → Verify pattern
> - `runPlanExecute()` - Plan → Execute loop
>
> **Note:** These are convenience patterns used in existing recipes. For custom processes, you can use the SDK intrinsics directly.

This clarifies that:
1. Core SDK = `@a5c-ai/babysitter-sdk` with intrinsics
2. Patterns = `.a5c/processes/core/` abstractions built on top
3. Custom processes can use either

---

### Study SDK Examples

**Before:**
```bash
cat .a5c/processes/roles/qa.js
cat .a5c/processes/roles/development/recipes/bugfix.js
```

**After:**
```bash
# Read the SDK specification
cat sdk.md

# See SDK examples (Section 9)
# - Minimal process with single task
# - CI pipeline with parallel steps and breakpoint
# - Sleep gate usage
```

**Reason:** Point to the authoritative SDK documentation first, then existing recipes as secondary examples.

---

## Common Patterns Updated

All 4 patterns now use actual SDK API:

1. **Single task process** - Simple `ctx.task()` call
2. **Parallel execution** - Using `ctx.parallel.all()` with thunks
3. **Conditional breakpoint** - `ctx.breakpoint()` with payload
4. **Time-gated execution** - `ctx.sleepUntil()` with ISO timestamp

Each pattern is a complete, working example using only SDK intrinsics.

---

## API Concepts Documented

### Effects and Exceptions

From SDK §2:
- Intrinsics throw **typed exceptions** (`EffectRequested`, `EffectPending`)
- Orchestrator catches these and dispatches work
- On replay, resolved effects return immediately (deterministic resume)

### Invocation Identity

From SDK §3:
- `invocationKey = processId:stepId:taskId`
- `stepId` increments per intrinsic call (S000001, S000002, ...)
- Enables deterministic replay

### Task System

From SDK §5:
- Everything is a task (`kind="node"`, `"breakpoint"`, `"sleep"`, etc.)
- TaskDef describes **what** to do, not **how** (orchestrator decides)
- `defineTask()` returns callable with metadata

---

## Mistakes Section Updated

**Added to #5:**
```
- Wrong: Using ctx.note(), ctx.artifact(), ctx.develop, requireAct()
- Right: Use SDK intrinsics: ctx.task(), ctx.breakpoint(), ctx.sleepUntil()
- The actual SDK API is defined in sdk.md
```

This makes clear that the SDK is the source of truth, not inferred patterns.

---

## Files Changed

1. **`.claude/skills/babysitter/SKILL.md`**
   - Updated with SDK-based examples
   - Corrected all API references
   - Added SDK documentation pointers

2. **`plugins/babysitter/skills/babysitter/SKILL.md`**
   - Identical copy (synced)

---

## Validation

To validate these changes work:

```bash
# 1. Create a process using actual SDK API
cat > .a5c/processes/roles/qa/recipes/test_sdk.js <<'EOF'
import { defineTask } from "@a5c-ai/babysitter-sdk";

const testTask = defineTask("test", (args, taskCtx) => ({
  kind: "node",
  title: "Test task",
  node: { entry: "echo", args: ["hello"] },
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(testTask, {});
  return { ok: true };
}
EOF

# 2. Create a run
npx -y @a5c-ai/babysitter-sdk run:create \
  --process-id qa/test-sdk \
  --entry .a5c/processes/roles/qa/recipes/test_sdk.js#process \
  --inputs /tmp/inputs.json \
  --run-id test-sdk-001

# 3. Drive orchestration
npx -y @a5c-ai/babysitter-sdk run:continue .a5c/runs/test-sdk-001
```

Should now work without "note is not a function" or other API errors.

---

## References

- **SDK Spec:** `sdk.md` (sections 1-13)
- **Process API:** `sdk.md` §6 (ProcessContext)
- **Task Definition:** `sdk.md` §5 (Task System)
- **Examples:** `sdk.md` §9
- **CLI Commands:** `sdk.md` §12

---

## Key Takeaway

**The SDK (`@a5c-ai/babysitter-sdk`) is the foundational API.**

Everything else (`.a5c/processes/core/` patterns, existing recipes) is built **on top** of it. When writing custom processes:

1. Start with SDK primitives (`ctx.task`, `ctx.breakpoint`, `ctx.sleepUntil`)
2. Define tasks with `defineTask(id, impl)` returning TaskDef
3. Use process signature: `async function process(inputs, ctx)`
4. Optionally compose with higher-level patterns if needed

This ensures code works with the actual runtime and CLI.
