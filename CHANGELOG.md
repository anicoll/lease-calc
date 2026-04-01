# Changelog

## [0.2.0] – 2026-04-01

### Added
- **Regular financing comparison** – optional toggle to compare your novated lease against a standard car loan side-by-side, with configurable loan rate and balloon/residual

### Fixed
- ECM pre/post-tax split corrected: the post-tax ECM contribution now replaces part of the pre-tax salary sacrifice rather than being added on top, matching real-world novated lease quote structures
- Stamp duty calculations updated with more accurate state-by-state bracket formulas:
  - NSW: removed incorrect EV concession (no exemption applies)
  - VIC: EVs/PHEVs now calculated at $8.40 per $200 (4.2%) rather than exempt
  - QLD: EVs/PHEVs now at $2 per $100 rather than exempt
  - SA: corrected to marginal bracket formula — 4% applies to amount over $3,000, not the full price
  - WA: added tiered rates (2.75% → ~4% → 6.5% over $50k); removed incorrect EV exemption
  - TAS: added proper bracket formula replacing flat 3%
  - NT: added $18 transfer fee and BEV concession of up to $1,500 for vehicles ≤$50k
- Added stamp duty disclaimer noting the estimate is calculated on the drive-away price, which includes stamp duty and other fees (CTP, registration, plates)

## [0.1.0] – 2026-04-01

### Added
- Initial release of the Novated Lease Calculator
- Pre-tax salary deduction and post-tax Employee Contribution Method (ECM) calculation
- FBT exemption detection for battery electric vehicles (BEV) and eligible plug-in hybrids (PHEV delivered before 1 April 2025)
- Income tax savings estimate using 2024–25 ATO tax brackets, including Medicare levy and LITO
- Luxury Car Tax (LCT) and state stamp duty estimates for all eight states and territories
- ATO minimum residual value enforcement for lease terms of 1–5 years
- Running costs can be entered monthly or annually
- Fortnightly payment toggle on the results panel
- **Lease Analyser** – check whether your existing novated lease is overcharging you by comparing the implied interest rate against a benchmark
- Changelog viewer so you can see what has changed and when
