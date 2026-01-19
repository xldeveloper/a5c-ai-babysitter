# Agent Task Corrections - Final Update

**Date:** 2026-01-19
**Files Updated:**
- `.claude/skills/babysitter/SKILL.md`
- `plugins/babysitter/skills/babysitter/SKILL.md`
- `plugins/babysitter/ADVANCED_PATTERNS.md`

---

## Summary

Applied final corrections to all agent task examples based on user feedback. The agent task structure now correctly uses:

1. **Sub-agent names** (not runtime names like "claude-code")
2. **Structured JSON prompts** (not separate system/user messages)
3. **No model specification** (orchestrator decides)
4. **Proper terminology** ("agentic" or neutral, not "LLM-based")

---

## Corrections Applied

### 1. Agent Name Field

**Before (WRONG):**
```javascript
agent: {
  name: "claude-code",  // Runtime name
  // ...
}
```

**After (CORRECT):**
```javascript
agent: {
  name: "code-reviewer",  // Sub-agent name
  // ...
}
```

**Sub-agent names used:**
- `"code-reviewer"` - Pattern 5 (code review agent)
- `"quality-scorer"` - Pattern 7 scoreTask (quality evaluation)
- `"code-improver"` - Pattern 7 improveTask (code improvement)

**Rationale:** The `name` field identifies the specific agent capability, not the runtime executing it. This allows the orchestrator to dispatch to the appropriate agent implementation.

---

### 2. Prompt Structure

**Before (WRONG):**
```javascript
prompt: {
  system: "You are a senior code reviewer specialized in...",
  user: "Review the following code changes:\n\n${diff}"
}
```

**After (CORRECT):**
```javascript
prompt: {
  role: "senior code reviewer",
  task: "Analyze the code for quality, security, and best practices",
  context: {
    diff: args.diffContent,
    files: args.files,
    focusAreas: ["security vulnerabilities", "error handling", "code style", "performance"]
  },
  instructions: [
    "Review each file in the diff",
    "Identify issues and categorize by severity (critical, high, medium, low)",
    "Provide specific line numbers and suggestions for each issue",
    "Generate a summary of overall code quality"
  ],
  outputFormat: "Structured JSON with summary and issues array"
}
```

**Rationale:** Structured JSON prompts provide:
- **Clarity:** Clear separation of concerns (role, task, context, instructions)
- **Composability:** Context can be built programmatically from task args
- **Consistency:** Standard format across all agent tasks
- **Maintainability:** Easier to understand and modify

---

### 3. Model Specification Removed

**Before (WRONG):**
```javascript
agent: {
  name: "code-reviewer",
  model: "claude-sonnet-4-5",  // Unnecessary
  prompt: { ... }
}
```

**After (CORRECT):**
```javascript
agent: {
  name: "code-reviewer",
  // No model field - orchestrator decides
  prompt: { ... }
}
```

**Rationale:** The orchestrator manages model selection based on:
- Agent requirements
- Resource availability
- Cost/performance trade-offs
- Runtime configuration

---

### 4. Terminology Updates

**Before (WRONG):**
- "LLM-based code review"
- "LLM-powered tasks"

**After (CORRECT):**
- "Agentic code review" or "Code review"
- "Agent-based execution"
- "Agent-powered tasks"

**Rationale:** Focus on the capability (agent) rather than the implementation detail (LLM). This:
- Is more accurate (agents may use multiple models or tools)
- Avoids implementation details in API design
- Maintains abstraction layer

---

## Complete Examples

### Pattern 5: Agent-Based Code Review

```javascript
import { defineTask } from "@a5c-ai/babysitter-sdk";

const codeReviewAgentTask = defineTask("code-review-agent", (args, taskCtx) => {
  const effectId = taskCtx.effectId;

  return {
    kind: "agent",
    title: "Agentic code review",
    description: "Code review of changes using an agent",

    agent: {
      name: "code-reviewer",  // The sub-agent name (not the runtime)
      prompt: {
        // Structured prompt as JSON for clarity
        role: "senior code reviewer",
        task: "Analyze the code for quality, security, and best practices",
        context: {
          diff: args.diffContent,
          files: args.files,
          focusAreas: ["security vulnerabilities", "error handling", "code style", "performance"]
        },
        instructions: [
          "Review each file in the diff",
          "Identify issues and categorize by severity (critical, high, medium, low)",
          "Provide specific line numbers and suggestions for each issue",
          "Generate a summary of overall code quality"
        ],
        outputFormat: "Structured JSON with summary and issues array"
      },
      outputSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                file: { type: "string" },
                line: { type: "number" },
                description: { type: "string" },
                suggestion: { type: "string" }
              }
            }
          }
        }
      }
    },

    io: {
      inputJsonPath: `tasks/${effectId}/input.json`,
      outputJsonPath: `tasks/${effectId}/result.json`,
    },

    labels: ["agent", "code-review"],
  };
});

// Usage in process
export async function process(inputs, ctx) {
  const review = await ctx.task(codeReviewAgentTask, {
    diffContent: inputs.diff,
    files: inputs.files
  });

  return { review };
}
```

### Pattern 7: Quality Scorer Agent

```javascript
const scoreTask = defineTask("score-quality", (args, taskCtx) => ({
  kind: "agent",
  title: `Score quality (iteration ${args.iteration})`,

  agent: {
    name: "quality-scorer",
    prompt: {
      role: "quality scorer",
      task: "Evaluate the code against criteria and return a score 0-100",
      context: {
        analysis: args.analysis,
        criteria: args.criteria,
        iteration: args.iteration
      },
      instructions: [
        "Review the analysis results",
        "Score each criterion from 0-100",
        "Provide justification for each score",
        "Calculate overall score (average of criteria scores)",
        "Generate actionable recommendations for improvement"
      ],
      outputFormat: "JSON with overallScore, criteriaScores array, and recommendations array"
    },
    outputSchema: {
      type: "object",
      properties: {
        overallScore: { type: "number", minimum: 0, maximum: 100 },
        criteriaScores: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criterion: { type: "string" },
              score: { type: "number" },
              justification: { type: "string" }
            }
          }
        },
        recommendations: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ["agent", "scoring", `iteration-${args.iteration}`],
}));
```

### Pattern 7: Code Improver Agent

```javascript
const improveTask = defineTask("improve-code", (args, taskCtx) => ({
  kind: "agent",
  title: `Improve code (iteration ${args.iteration})`,

  agent: {
    name: "code-improver",
    prompt: {
      role: "code improvement agent",
      task: "Apply recommendations to improve code quality",
      context: {
        analysis: args.analysis,
        scoring: args.scoring,
        iteration: args.iteration
      },
      instructions: [
        "Review the scoring results and recommendations",
        "Apply each recommendation to the codebase",
        "Track all changes made (file-level and specific edits)",
        "Ensure changes don't break existing functionality",
        "Generate a summary of improvements"
      ],
      outputFormat: "JSON with changesMade array and filesModified array"
    },
    outputSchema: {
      type: "object",
      properties: {
        changesMade: {
          type: "array",
          items: { type: "string" }
        },
        filesModified: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },

  labels: ["agent", "improvement", `iteration-${args.iteration}`],
}));
```

---

## Verification

All files checked for:
- ✅ No references to "claude-code" (runtime name)
- ✅ No `model:` field specifications
- ✅ No "LLM-based" terminology
- ✅ All prompts use structured JSON format
- ✅ All agent names are sub-agent identifiers

**Grep verification results:**
```bash
# Check for incorrect patterns
grep -r "claude-code" .claude/skills/babysitter/SKILL.md plugins/babysitter/ADVANCED_PATTERNS.md
# Result: No matches

grep -r 'model:\s*"claude' .claude/skills/babysitter/SKILL.md plugins/babysitter/ADVANCED_PATTERNS.md
# Result: No matches

grep -r "LLM-based" .claude/skills/babysitter/SKILL.md plugins/babysitter/ADVANCED_PATTERNS.md
# Result: No matches
```

---

## Files Synced

Final sync performed:
```bash
cp .claude/skills/babysitter/SKILL.md plugins/babysitter/skills/babysitter/SKILL.md
```

Both copies now contain identical, corrected agent task examples.

---

## Key Takeaways

### For Task Definitions

1. **Agent name = capability identifier**, not runtime
   - Good: "code-reviewer", "quality-scorer", "security-analyzer"
   - Bad: "claude-code", "gpt-4", "codex-agent"

2. **Structured prompts = composable and clear**
   - Use: role, task, context, instructions, outputFormat
   - Avoid: system/user message split with string interpolation

3. **Let orchestrator manage model selection**
   - Don't specify model in task definition
   - Orchestrator handles resource allocation

4. **Use neutral terminology**
   - "Agent" describes the abstraction
   - Implementation details (LLM, API, runtime) are hidden

### For Orchestration Code

Agent tasks are invoked exactly like any other task:

```javascript
const result = await ctx.task(agentTask, {
  // Arguments that populate the prompt context
  diffContent: inputs.diff,
  files: inputs.files
});
```

The orchestrator:
1. Evaluates the task definition (including prompt construction)
2. Dispatches to the appropriate agent runtime
3. Returns structured output according to outputSchema
4. Records the effect in the journal for replay

---

## Documentation Updated

**SKILL.md sections:**
- Section 3.7 Pattern 5 (agent-based execution)
- Section 3.7 Pattern 7 (iterative convergence with agent scoring/improvement)

**ADVANCED_PATTERNS.md sections:**
- Pattern 5: Agent-Based Execution (complete example)
- Pattern 7: Complex Iterative Convergence (scoreTask and improveTask)
- Agent-Based Scoring section (prompt structure example)

All examples now demonstrate the correct agent task structure.
