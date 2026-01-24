---
name: randomization-generator
description: Randomization protocol for allocation sequence generation and block randomization
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

# Randomization Generator

## Purpose

Provides randomization protocol capabilities for allocation sequence generation, stratified randomization, and audit trail creation.

## Capabilities

- Simple randomization
- Block randomization (fixed/permuted)
- Stratified randomization
- Minimization/adaptive randomization
- Allocation concealment verification
- Randomization audit trail

## Usage Guidelines

1. **Method Selection**: Choose appropriate randomization method
2. **Block Size**: Consider practical and statistical factors
3. **Stratification**: Stratify on key prognostic factors
4. **Concealment**: Ensure proper allocation concealment

## Tools/Libraries

- scipy
- random
- Custom protocols
