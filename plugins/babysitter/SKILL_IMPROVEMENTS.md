# Babysitter Skill Documentation Improvements

**Date:** 2026-01-19
**Files Updated:**
- `.claude/skills/babysitter/SKILL.md`
- `plugins/babysitter/skills/babysitter/SKILL.md`

---

## Summary

Updated the babysitter skill documentation to prevent common mistakes when writing custom orchestration processes. The main issue was that the instructions were ambiguous about where to create custom process files and what API was available, leading to:

1. Files created in wrong locations (`.a5c/temp-review/`) causing import failures
2. Incorrect assumptions about context API (`ctx.note()`, `ctx.artifact()` don't exist)
3. Skipping orchestration and doing work manually

---

## Changes Made

### 1. Clarified Section 3.5 Mode B (Creating Custom Workflows)

**Before:**
```markdown
3. OR: For custom workflows, create `main.js` and `process.md` in a temporary location first, then use `run:create` pointing to them
```

**After:**
```markdown
3. OR: For custom workflows:
   - Create recipe file in `.a5c/processes/roles/<category>/recipes/<name>.js`
   - Export your workflow function (e.g., `export const myWorkflow = (task, ctx) => {...}`)
   - Study existing recipes in `.a5c/processes/roles/development/recipes/` for patterns
   - See section 3.7 below for detailed guidance on writing custom processes
   - Use `run:create --entry .a5c/processes/roles/<category>/recipes/<name>.js#myWorkflow`
```

**Reason:** "Temporary location" was ambiguous and led to files being created in wrong places where imports break.

---

### 2. Added New Section 3.7: Writing Custom Process Functions

This comprehensive new section covers:

#### File Location
- Explicit path pattern: `.a5c/processes/roles/<category>/recipes/<name>.js`
- Examples for different categories (development, qa, meta)
- Warning against temporary locations

#### Basic Structure
- Function signature pattern
- Import examples
- Return value structure

#### Available Orchestration Primitives
Documented the actual SDK primitives:
- `runQualityGate()` - Quality-gated iteration loop
- `runTriageFixVerify()` - Triage → Fix → Verify pattern
- `runPlanExecute()` - Plan → Execute loop
- `normalizeTask()` - Task normalization
- `requireAct()` - Get action executor

#### Context API - IMPORTANT Section
Explicitly states what **DOESN'T** exist:
```javascript
// ❌ WRONG - these methods don't exist
await ctx.note("Starting phase 1");
await ctx.artifact("report.md", content);
```

Shows what **DOES** work:
```javascript
// ✅ CORRECT - use orchestration primitives
const act = requireAct(ctx);
const result = act("Analyze the codebase", { ...ctx });
```

#### Common Patterns
Three concrete examples:
1. Quality-gated analysis
2. Using act for simple actions
3. Composing with aspects

**Reason:** Without this guidance, agents assume Node.js-style APIs that don't exist in the SDK.

---

### 3. Added New Section 3.8: Understanding the Orchestration Model

Explains fundamental concepts:

- **Effects** - Actions queued for execution
- **Node Tasks** - JavaScript functions in orchestrator
- **State Machine** - Run lifecycle (created → running → completed/failed)
- **Journal** - Event-sourced log structure
- **The `act` Function** - Primary way to execute work
- **Quality Gates** - Iterative refinement loops

**Reason:** Understanding the model helps write correct orchestration code.

---

### 4. Updated Section 11: Complete Workflow Example

**Before:**
```bash
# Step 3: Create main.js and process.md with implementation plan
# (Create these files with the step-by-step process)
```

**After:**
```bash
# Step 3: Create the process file in the correct location
cat > .a5c/processes/roles/development/recipes/ui_improvement.js <<'EOF'
import { runQualityGate } from "../../../core/loops/quality_gate.js";
import { normalizeTask } from "../../../core/task.js";

export const improveBreakpointsUI = (task, ctx = {}) => {
  const input = normalizeTask(task);

  return runQualityGate({
    task: { title: "Improve breakpoints UI", input },
    ctx,
    develop: ctx.develop,
    criteria: [
      "UI is responsive and accessible",
      "Changes follow existing design patterns",
      "No duplicate event listeners",
      "All visual feedback is clear and consistent"
    ],
    threshold: 0.85,
    maxIters: 5
  });
};
EOF
```

**Reason:** Shows concrete example with proper file location, imports, and API usage.

---

### 5. Enhanced Section 9: Common Mistakes to Avoid

Added new mistakes:

**#2: Creating process files in wrong locations**
- Wrong: `.a5c/temp-review/main.js`
- Right: `.a5c/processes/roles/<category>/recipes/<name>.js`
- Reason: Imports break, module resolution fails

**#5: Assuming wrong context API**
- Wrong: Using `ctx.note()`, `ctx.artifact()`
- Right: Use `requireAct(ctx)` and orchestration primitives

**Reason:** These were the exact mistakes made in the consistency review task.

---

## Testing Impact

The improvements should prevent these issues:

### Issue 1: Module Resolution Failures
```
Failed to load process module at C:\...\temp-review\main.js
(node:37996) Warning: To load an ES module, set "type": "module"
```

**Fix:** Files now go in `.a5c/processes/roles/` where module resolution works.

### Issue 2: Runtime Errors
```
TypeError: note is not a function
```

**Fix:** Documentation now explicitly shows the correct API patterns.

### Issue 3: Skipping Orchestration
After approval, directly editing files instead of using `run:continue`.

**Fix:** Multiple sections emphasize the orchestration-driven workflow.

---

## Key Principles Reinforced

1. **Explicit file locations** - No more "temporary location" ambiguity
2. **Correct API documentation** - Show what exists, not what's assumed
3. **Study existing code** - Point to actual examples in the codebase
4. **Orchestration-first** - Multiple reminders to use CLI, not manual edits
5. **Concrete examples** - Working code snippets, not just descriptions

---

## Files to Review

When writing custom processes, study these examples:
- `.a5c/processes/roles/qa.js` - Quality-gated workflows
- `.a5c/processes/roles/development/recipes/bugfix.js` - Triage pattern
- `.a5c/processes/roles/development/recipes/full_project.js` - Complex composition

---

## Next Steps for Users

When you need custom orchestration:

1. **Read Section 3.7** - Complete guide to custom processes
2. **Study existing recipes** - See patterns in action
3. **Create file in correct location** - `.a5c/processes/roles/<category>/recipes/<name>.js`
4. **Use correct API** - `requireAct()`, `runQualityGate()`, not `ctx.note()`
5. **Drive through CLI** - Always use `run:create` → `run:continue`

---

## Validation

To validate these changes, try the original task again:
```bash
# Should now work without errors:
# 1. Create .a5c/processes/roles/qa/recipes/consistency_review.js
# 2. Use proper SDK primitives (runQualityGate, requireAct)
# 3. run:create pointing to the recipe
# 4. run:continue to execute
```
