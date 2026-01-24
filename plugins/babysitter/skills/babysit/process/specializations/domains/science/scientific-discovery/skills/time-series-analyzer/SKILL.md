---
name: time-series-analyzer
description: Time series analysis for trend detection, seasonality decomposition, and forecasting
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

# Time Series Analyzer

## Purpose

Provides time series analysis capabilities for trend detection, seasonality decomposition, and forecasting.

## Capabilities

- Stationarity testing (ADF, KPSS)
- Decomposition (STL, seasonal)
- ARIMA/SARIMA modeling
- Prophet/exponential smoothing
- Change point detection
- Forecast uncertainty quantification

## Usage Guidelines

1. **Stationarity**: Test and achieve stationarity
2. **Decomposition**: Separate trend, seasonal, and residual
3. **Model Selection**: Choose appropriate forecasting model
4. **Uncertainty**: Quantify forecast uncertainty

## Tools/Libraries

- statsmodels
- Prophet
- pmdarima
