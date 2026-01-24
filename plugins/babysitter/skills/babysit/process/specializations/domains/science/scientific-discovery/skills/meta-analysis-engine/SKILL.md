---
name: meta-analysis-engine
description: Meta-analysis for effect size pooling, heterogeneity assessment, and publication bias detection
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
  category: statistical-analysis
  phase: 6
---

# Meta-Analysis Engine

## Purpose

Provides meta-analysis capabilities for effect size pooling, heterogeneity assessment, and publication bias detection.

## Capabilities

- Fixed/random effects meta-analysis
- Heterogeneity metrics (I-squared, tau-squared)
- Funnel plot generation
- Trim-and-fill analysis
- Subgroup analysis
- Meta-regression

## Usage Guidelines

1. **Effect Size Extraction**: Extract standardized effect sizes
2. **Heterogeneity Assessment**: Evaluate between-study variance
3. **Publication Bias**: Test and adjust for bias
4. **Sensitivity Analysis**: Check robustness of findings

## Tools/Libraries

- metafor (R via rpy2)
- PythonMeta
- forestplot
