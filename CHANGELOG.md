# Changelog

## [0.6.0] – 2026-05-29

### Added
- **UI Dashboard Overhaul**: Integrated a fixed left sidebar navigation on desktop (with a toggle drawer menu on mobile), a 2x2 grid summary of outcome KPIs, and custom interactive SVG-based comparison line charts for lease terms.
- **Quote Limits**: Enforced a maximum limit of 5 saved quotes, complete with inline dashboard warning messages.
- **Quote Comparison Checklist**: Added checkbox selectors directly to the Compare Quotes page to control side-by-side table comparisons in real time.

### Changed
- Decoupled selector checkboxes and selection badges from the Saved Quotes list to focus that tab solely on loading or deleting configurations.

## [0.5.0] – 2026-05-12

### Added
- **FBT phase-out support** – calculator now models the three-phase reduction of the BEV FBT exemption announced in the May 2026 Federal Budget
  - Phase 1 (now – 31 March 2027): full exemption unchanged for BEVs under $91,387
  - Phase 2 (1 April 2027 – 31 March 2029): full exemption for BEVs ≤ $75,000; 25% exemption (75% FBT payable) for BEVs $75,001–$91,387
  - Phase 3 (from 1 April 2029): 25% exemption for all BEVs under the LCT threshold
- **Lease start date input** – used to determine which phase rules apply; defaults to today
- **Grandfathering checkbox** – leases entered into before 1 April 2027 retain full Phase 1 exemption for the entire lease term
- **Phase-crossing warning** – shown when a Phase 2 lease will run into Phase 3, so users understand future rule changes won't affect their existing lease

### Changed
- FBT status now shows three states: *FBT Exempt*, *Partial FBT Exemption (25% exempt)*, and *Subject to FBT*, replacing the previous binary exempt/not-exempt display
- ECM post-tax contribution is reduced for partially exempt vehicles (covers only the 75% FBT-exposed portion)

## [0.4.0] – 2026-05-12

### Changed
- **Lease term comparison table** – removed the single lease term selector; the calculator now runs all 5 terms (1–5 years) simultaneously and displays a side-by-side comparison table showing monthly payment, residual value, total interest cost, annual tax saving, and net out-of-pocket for each term
- Clicking a column in the comparison table expands the full breakdown for that term

## [0.3.0] – 2026-04-01

### Added
- **Early Termination calculator** – new tab to estimate the cost of exiting a novated lease early (redundancy, job change, or personal choice). Shows the finance payout, vehicle equity position, partial-year FBT exposure, and a note on recovering your ECM/running costs account balance.

## [0.2.0] – 2026-04-01

### Added
- **Loan comparison** – optional toggle to compare your novated lease against a standard car loan, with configurable rate and balloon

### Fixed
- ECM pre/post-tax split corrected: ECM contribution now replaces part of the pre-tax sacrifice rather than being added on top
- Stamp duty formulas updated with accurate state-by-state brackets for all 8 states/territories

## [0.1.0] – 2026-04-01

### Added
- Initial release of the Novated Lease Calculator
- Pre-tax salary sacrifice and post-tax ECM calculation
- FBT exemption detection for BEVs and eligible PHEVs (delivered before 1 April 2025)
- Income tax savings using 2024–25 ATO brackets, Medicare levy, and LITO
- LCT and stamp duty estimates for all states and territories
- ATO minimum residual values for 1–5 year terms
- Running costs entry (monthly or annual) and fortnightly payment toggle
- **Lease Analyser** – reverse-engineer the implied interest rate on an existing lease and compare to a benchmark
- Changelog viewer
