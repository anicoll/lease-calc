# Novated Lease Calculator

An Australian novated lease calculator built with React and TypeScript. It covers FBT exemptions for electric and plug-in hybrid vehicles, income tax savings, and state-based stamp duty — giving you a clear picture of the real cost of a novated lease.

## Features

### New Lease Calculator
- Pre-tax salary deduction and post-tax Employee Contribution Method (ECM) amounts
- FBT exemption detection for battery electric vehicles (BEV) and eligible plug-in hybrids (PHEV delivered before 1 April 2025)
- Income tax savings estimate using 2024–25 ATO tax brackets, including Medicare levy and LITO
- Luxury Car Tax (LCT) estimate where applicable
- Stamp duty estimate for all eight states and territories, including EV concessions
- ATO minimum residual value enforcement for lease terms of 1–5 years
- Running costs can be entered monthly or annually

### Lease Analyser
- Paste in your existing lease deduction figures to check whether you are being overcharged
- Calculates the implied interest rate embedded in your current payments
- Compares against a benchmark rate you supply
- Highlights the monthly and annual dollar difference

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/`. The app is configured to be served from the `/lease-calc/` base path.

## Disclaimer

This calculator is for educational purposes only and does not constitute financial or tax advice. Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change. Always consult a qualified financial adviser before entering into a novated lease arrangement.
