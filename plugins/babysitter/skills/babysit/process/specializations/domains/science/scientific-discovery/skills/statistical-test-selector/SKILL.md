---
name: statistical-test-selector
description: Automated statistical test selection based on data characteristics and research question
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

# Statistical Test Selector

## Purpose

Provides automated statistical test selection based on data characteristics, research question, and assumption checking.

## Capabilities

- Data distribution assessment
- Assumption testing (normality, homoscedasticity)
- Test recommendation based on design
- Non-parametric alternative suggestions
- Multiple comparison correction guidance
- Effect size calculator integration

## Usage Guidelines

1. **Data Assessment**: Profile data characteristics first
2. **Assumption Checking**: Test assumptions before selecting tests
3. **Alternatives**: Consider non-parametric alternatives
4. **Multiple Testing**: Apply appropriate corrections

## Tools/Libraries

- scipy.stats
- pingouin
- statsmodels
