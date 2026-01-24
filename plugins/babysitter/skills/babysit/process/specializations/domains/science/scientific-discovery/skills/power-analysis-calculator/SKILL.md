---
name: power-analysis-calculator
description: Statistical power analysis for sample size determination and sensitivity analysis
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
  category: experimental-design
  phase: 6
---

# Power Analysis Calculator

## Purpose

Provides statistical power analysis capabilities for sample size determination, effect size estimation, and sensitivity analysis.

## Capabilities

- A priori power analysis
- Post-hoc power calculation
- Sensitivity analysis (effect size)
- Multiple comparison adjustment
- Complex design power (factorial, repeated measures)
- Power curve visualization

## Usage Guidelines

1. **Effect Size**: Specify meaningful effect sizes
2. **Alpha Level**: Set appropriate significance level
3. **Power Target**: Typically aim for 0.80 or higher
4. **Design Complexity**: Account for design factors

## Tools/Libraries

- statsmodels
- pingouin
- GPower (via API)
