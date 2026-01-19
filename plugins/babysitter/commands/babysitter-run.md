---
description: "Start babysitter run in current session"
argument-hint: "PROMPT [--max-iterations N] [--completion-promise TEXT]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-babysitter-run.sh:*)"]
hide-from-slash-command-tool: "true"
---

# Babysitter Loop Command

Execute the setup script to initialize the Babysitter run:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-babysitter-run.sh" $ARGUMENTS
```

Please work on the task. When you try to exit, the Babysitter run will feed the next orchestration prompt back to you for the next iteration. You'll see your previous work in journal, files and git history, allowing you to iterate and improve.

CRITICAL RULE: If a completion promise is set, you may ONLY output it when the statement is completely and unequivocally TRUE. Do not output false promises to escape the run, even if you think you're stuck or should exit for other reasons. The run is designed to continue until genuine completion.