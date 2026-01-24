---
name: doe-optimizer
description: Design of Experiments optimization for factorial design and response surface methodology
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

# DOE Optimizer

## Purpose

Provides Design of Experiments optimization capabilities for factorial design, response surface methodology, and optimal design selection.

## Capabilities

- Full/fractional factorial design
- Response surface methodology (RSM)
- D-optimal/I-optimal design generation
- Taguchi orthogonal arrays
- Design evaluation metrics
- Confounding structure analysis

## Usage Guidelines

1. **Design Selection**: Choose appropriate design type
2. **Factor Levels**: Define factor levels appropriately
3. **Confounding**: Understand confounding structure
4. **Optimality**: Use optimal designs when appropriate

## Tools/Libraries

- pyDOE2
- statsmodels
- scipy.optimize
