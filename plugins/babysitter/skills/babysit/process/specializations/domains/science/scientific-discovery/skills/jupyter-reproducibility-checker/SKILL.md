---
name: jupyter-reproducibility-checker
description: Notebook reproducibility validation for dependency tracking and environment capture
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
metadata:
  specialization: scientific-discovery
  domain: science
  category: reproducibility
  phase: 6
---

# Jupyter Reproducibility Checker

## Purpose

Provides notebook reproducibility validation capabilities for dependency tracking, execution order verification, and environment capture.

## Capabilities

- Cell execution order validation
- Hidden state detection
- Dependency extraction (pipreqs)
- Environment capture (pip freeze, conda)
- Notebook linting
- Reproducibility scoring

## Usage Guidelines

1. **Execution Order**: Verify cells run in order
2. **Hidden State**: Detect and eliminate hidden state
3. **Dependencies**: Extract and pin dependencies
4. **Environment**: Capture complete environment

## Tools/Libraries

- nbQA
- papermill
- pipreqs
- nbstripout
