# Novated Lease Calculator — Implementation Specification

> **Purpose:** This document is a self-contained implementation spec. An AI agent or developer should be able to build the entire application from this document alone, without needing to consult any other source.

---

## 1. Overview

A client-side web application that helps Australian employees evaluate the true cost of a novated lease arrangement. The app covers:

- **New Lease Calculator** — calculates monthly payments, income tax saving, FBT treatment, LCT, and state stamp duty.
- **Analyse My Lease** — lets users input their current lease details to reverse-engineer the effective interest rate and identify potential overcharging.

### Constraints
- No backend, no database, no authentication.
- Static build only (`dist/` folder served from GitHub Pages).
- Mobile-first, works on all screen sizes.
- TypeScript (strict mode) throughout.

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.x | UI framework |
| Vite | 6.x | Build tool / dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| peaceiris/actions-gh-pages | v4 | GitHub Pages deployment |

**No** external form libraries, charting libraries, or state managers.

---

## 3. Project Structure

```
lease-calc/
├── docs/
│   └── implementation-spec.md       ← this file
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Calculator/
│   │   │   ├── InputForm.tsx
│   │   │   └── ResultsPanel.tsx
│   │   ├── LeaseAnalyser/
│   │   │   ├── AnalyserForm.tsx
│   │   │   └── AnalyserResults.tsx
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   └── TabNav.tsx
│   │   └── ui/
│   │       ├── InputField.tsx
│   │       ├── ResultRow.tsx
│   │       └── SectionCard.tsx
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── tax.ts
│   │   │   ├── fbt.ts
│   │   │   ├── lease.ts
│   │   │   └── novatedLease.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 4. TypeScript Types (`src/types/index.ts`)

```ts
export type VehicleType = 'BEV' | 'PHEV' | 'ICE'
// BEV  = Battery Electric Vehicle (zero tailpipe emissions)
// PHEV = Plug-in Hybrid Electric Vehicle
// ICE  = Internal Combustion Engine (petrol/diesel/standard hybrid)

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT'

export interface RunningCosts {
  fuel: number          // annual fuel or charging cost
  registration: number  // annual rego
  insurance: number     // annual comprehensive insurance
  tyres: number         // annual tyre budget
  maintenance: number   // annual servicing / repairs
}

export interface LeaseInputs {
  grossSalary: number                 // annual gross income before tax
  vehicleCost: number                 // drive-away price incl. GST, excl. LCT and stamp duty
  vehicleType: VehicleType
  phevDeliveredBeforeApril2025: boolean  // relevant only for PHEV FBT exemption
  interestRate: number                // annual rate as decimal, e.g. 0.075 for 7.5%
  termYears: number                   // 1–5
  customResidualPercent: number | null // null = use ATO minimum
  annualManagementFee: number         // provider admin fee per year
  runningCosts: RunningCosts
  state: AustralianState
}

export interface LeaseResult {
  fbtExempt: boolean
  lctApplied: number          // LCT amount in dollars (upfront, shown separately)
  stampDutyApplied: number    // state stamp duty in dollars (upfront, shown separately)
  effectiveBaseValue: number  // vehicleCost (LCT not added to lease base in this model)
  residualValue: number       // dollar residual
  residualPercent: number     // fraction, e.g. 0.2813 for 28.13%
  monthlyLeasePayment: number
  annualLeasePayment: number
  annualRunningCosts: number
  annualManagementFee: number
  annualPreTaxDeduction: number    // total salary sacrificed pre-tax
  annualPostTaxDeduction: number   // ECM contribution (0 if FBT exempt)
  monthlyPreTaxDeduction: number
  monthlyPostTaxDeduction: number
  taxBeforeSacrifice: number
  taxAfterSacrifice: number
  annualTaxSaving: number
  netAnnualCost: number
  effectiveMonthlyOutOfPocket: number
  newTaxableIncome: number
}

export interface AnalyserInputs {
  vehicleBaseValue: number
  termRemainingMonths: number
  monthlyPreTax: number         // total monthly pre-tax deduction from payslip
  monthlyPostTax: number        // post-tax ECM contribution (0 if EV)
  monthlyManagementFee: number  // provider admin fee per month
  monthlyRunningCosts: number   // running costs budget per month
  benchmarkRate: number         // comparison rate as decimal, e.g. 0.075
}

export interface AnalyserResult {
  impliedInterestRate: number | null  // null if Newton-Raphson fails to converge
  benchmarkMonthlyLease: number
  actualMonthlyLease: number
  monthlyOvercharge: number           // positive = paying more than benchmark
  annualOvercharge: number
  managementFeePercent: number        // fee as % of vehicle value
  residualValue: number
}
```

---

## 5. Constants (`src/lib/constants.ts`)

All Australian Tax Office rates are for the **2024–25 financial year** (1 July 2024 – 30 June 2025).

### 5.1 FBT
```
FBT_RATE                = 0.47       // FBT rate (47%)
FBT_TYPE2_GROSS_UP      = 2.0802    // Type 2 gross-up factor
FBT_STATUTORY_FRACTION  = 0.20      // statutory fraction for all car fringe benefits
```

### 5.2 Luxury Car Tax (Federal)
```
LCT_THRESHOLD_FUEL_EFFICIENT = 91,387   // BEV, PHEV, fuel-efficient vehicles
LCT_THRESHOLD_GENERAL        = 76,950   // all other vehicles
LCT_RATE                     = 0.33
```

Source: ATO — [Luxury car tax rate and thresholds](https://www.ato.gov.au/rates/luxury-car-tax-rate-and-thresholds/)

### 5.3 ATO Minimum Residual Values
Source: ATO — [Safe harbour residuals (SAV/FBTGEMP/00008)](https://www.ato.gov.au/law/view/document?DocID=SAV/FBTGEMP/00008)

| Lease Term | Minimum Residual |
|-----------|----------------|
| 1 year    | 65.63%         |
| 2 years   | 56.25%         |
| 3 years   | 46.88%         |
| 4 years   | 37.50%         |
| 5 years   | 28.13%         |

### 5.4 Income Tax Brackets (2024-25)
| Taxable Income | Rate |
|---------------|------|
| $0 – $18,200 | Nil |
| $18,201 – $45,000 | 19c per $1 over $18,200 |
| $45,001 – $135,000 | $5,092 + 32.5c per $1 over $45,000 |
| $135,001 – $190,000 | $34,342 + 37c per $1 over $135,000 |
| $190,001+ | $55,042 + 45c per $1 over $190,000 |

Source: ATO — [Tax rates – Australian residents](https://www.ato.gov.au/rates/individual-income-tax-rates/)

### 5.5 Medicare Levy
- **Rate:** 2% of taxable income
- **Low-income threshold (singles):** $26,000 (2024-25)
- **Shade-in:** Between $26,000–$32,500, levy = 10% × (income − $26,000)

### 5.6 Low Income Tax Offset (LITO)
- **Maximum:** $700
- **Phase-out 1:** Reduces by $1.50 per $1 over $37,500 (until $45,000 → offset = $587.50)
- **Phase-out 2:** Reduces by $0.50 per $1 over $45,000 (fully phased out at ~$66,667)

### 5.7 State Stamp Duty (approximate 2024-25)
> **Disclaimer:** State stamp duty rates change frequently. Always verify with the relevant state revenue office before relying on these figures. EV exemptions are subject to policy changes.

| State | Standard Rate | EV Rate |
|-------|--------------|---------|
| NSW | 3% (≤$45k), 5% (>$45k) | 2% (reduced, not exempt) |
| VIC | 5.5% | 0% (BEV/PHEV exempt) |
| QLD | 3% (≤$100k), 5% (>$100k) | 0% (BEV exempt) |
| SA | 4% flat | 4% (no exemption) |
| WA | 2.75% flat | 0% (BEV exempt) |
| TAS | 3% flat | 3% (no exemption) |
| ACT | 3% flat | 0% (BEV exempt) |
| NT | 3% flat | 3% (no exemption) |

---

## 6. Calculation Formulas

### 6.1 FBT Exemption Eligibility

```
isFbtExempt(vehicleType, vehicleCost, phevDeliveredBeforeApril2025):
  if vehicleType == 'BEV':
    return vehicleCost <= LCT_THRESHOLD_FUEL_EFFICIENT   // $91,387
  if vehicleType == 'PHEV':
    return phevDeliveredBeforeApril2025 AND vehicleCost <= LCT_THRESHOLD_FUEL_EFFICIENT
  return false   // ICE never exempt
```

**ATO Reference:** [Electric cars exemption](https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption)

### 6.2 Luxury Car Tax

```
lct(vehicleCost, vehicleType):
  threshold = (vehicleType in ['BEV', 'PHEV'])
              ? LCT_THRESHOLD_FUEL_EFFICIENT   // $91,387
              : LCT_THRESHOLD_GENERAL          // $76,950
  if vehicleCost <= threshold:
    return 0
  // LCT is on the GST-exclusive amount above threshold
  return ((vehicleCost - threshold) / 1.1) * LCT_RATE   // LCT_RATE = 0.33
```

**Example:** $100,000 BEV → LCT = ((100,000 − 91,387) / 1.1) × 0.33 = **$2,584**

### 6.3 PMT (Monthly Lease Payment)

Standard financial present-value payment formula:

```
pmt(r, n, pv, fv):
  // r   = monthly interest rate (annual rate / 12)
  // n   = number of months
  // pv  = vehicle cost (positive)
  // fv  = residual value (positive, recovered at end)
  if r == 0:
    return (pv - fv) / n
  factor = (1 + r) ^ n
  return (pv * r * factor - fv * r) / (factor - 1)
```

**Example:** $65,000 vehicle, 5yr, 7.5% pa, 28.13% residual ($18,285)
- r = 0.075 / 12 = 0.00625
- n = 60
- pmt = (65000 × 0.00625 × 1.00625^60 − 18285 × 0.00625) / (1.00625^60 − 1)
- ≈ **$973/month**

### 6.4 Income Tax Calculation

```
incomeTax(taxableIncome):
  find bracket where taxableIncome falls
  return bracket.base + (taxableIncome - bracket.min + 1) * bracket.rate

medicareLevy(taxableIncome):
  if taxableIncome <= 26,000: return 0
  if taxableIncome <= 32,500: return (taxableIncome - 26,000) * 0.10
  return taxableIncome * 0.02

lito(taxableIncome):
  if taxableIncome <= 37,500: return 700
  if taxableIncome <= 45,000: return 700 - (taxableIncome - 37,500) * 0.015
  if taxableIncome <= 66,667: return max(0, 587.50 - (taxableIncome - 45,000) * 0.005)
  return 0

totalTax(taxableIncome):
  return max(0, incomeTax(taxableIncome) + medicareLevy(taxableIncome) - lito(taxableIncome))
```

### 6.5 FBT (Statutory Formula, non-exempt vehicles)

```
taxableValue   = vehicleBaseValue * 0.20
fbtPayable     = taxableValue * 2.0802 * 0.47

// Employee Contribution Method (ECM) to eliminate FBT:
ecmContribution = taxableValue   // = vehicleBaseValue * 0.20
// Employee pays this from after-tax salary → FBT reduced to $0
```

**Example:** $65,000 vehicle
- Taxable value = $65,000 × 20% = $13,000
- FBT payable (before ECM) = $13,000 × 2.0802 × 0.47 = **$12,710**
- ECM contribution = $13,000/yr ($1,083/month post-tax)

### 6.6 Full Novated Lease Calculation

```
Step 1: fbtExempt = isFbtExempt(vehicleType, vehicleCost, phevBefore)

Step 2: lctAmount = lct(vehicleCost, vehicleType)           // upfront, shown separately

Step 3: stampDuty = calculateStampDuty(vehicleCost, vehicleType, state)  // upfront

Step 4: residualPercent = customResidualPercent ?? ATO_RESIDUALS[termYears]
        residual = vehicleCost * residualPercent

Step 5: monthlyLease = pmt(interestRate/12, termYears*12, vehicleCost, residual)
        annualLease  = monthlyLease * 12

Step 6: annualRunningCosts = sum(runningCosts)

Step 7: totalPreTaxBudget = annualLease + annualRunningCosts + annualManagementFee

Step 8: if fbtExempt:
          annualPreTax  = totalPreTaxBudget
          annualPostTax = 0
        else:
          annualPostTax = vehicleCost * 0.20    // ECM
          annualPreTax  = totalPreTaxBudget

Step 9: newTaxableIncome = max(0, grossSalary - annualPreTax)

Step 10: annualTaxSaving = totalTax(grossSalary) - totalTax(newTaxableIncome)

Step 11: netAnnualCost = annualPreTax + annualPostTax - annualTaxSaving
         effectiveMonthlyOutOfPocket = netAnnualCost / 12
```

### 6.7 Worked Example — BEV (FBT Exempt)

| Input | Value |
|-------|-------|
| Gross salary | $120,000 |
| Vehicle cost | $65,000 BEV |
| Interest rate | 7.5% |
| Lease term | 5 years |
| Running costs | $6,200/yr |
| Management fee | $1,200/yr |
| State | NSW |

| Output | Value |
|--------|-------|
| FBT exempt | Yes |
| Residual (28.13%) | $18,285 |
| Monthly lease | ~$973 |
| Annual lease | ~$11,676 |
| Annual pre-tax sacrifice | ~$19,076 |
| Annual post-tax contribution | $0 |
| Tax before sacrifice | ~$32,242 |
| Tax after sacrifice | ~$26,032 |
| Annual tax saving | ~$6,210 |
| Net annual cost | ~$12,866 |
| Effective monthly out-of-pocket | ~$1,072 |
| LCT | $0 (under $91,387) |
| Stamp duty (NSW) | $3,250 |

### 6.8 Worked Example — ICE (FBT Applies, ECM)

| Input | Value |
|-------|-------|
| Gross salary | $80,000 |
| Vehicle cost | $50,000 ICE |
| Interest rate | 8% |
| Lease term | 3 years |
| Running costs | $7,500/yr |
| Management fee | $1,000/yr |
| State | VIC |

| Output | Value |
|--------|-------|
| FBT exempt | No |
| Residual (46.88%) | $23,440 |
| Monthly lease | ~$906 |
| Annual lease | ~$10,872 |
| Annual pre-tax sacrifice | ~$19,372 |
| Annual post-tax (ECM) | $10,000 (= $50k × 20%) |
| Tax saving | ~$5,918 |
| Net annual cost | ~$24,054 |
| Effective monthly | ~$1,705 |

### 6.9 "Analyse My Lease" Calculation

```
// Isolate pure lease component
actualMonthlyLease = monthlyPreTax - monthlyManagementFee - monthlyRunningCosts

// ATO residual for remaining term (rounded to nearest year, clamped 1–5)
termYears      = clamp(round(termRemainingMonths / 12), 1, 5)
residual       = vehicleBaseValue * ATO_RESIDUALS[termYears]

// Implied rate via Newton-Raphson (see lease.ts impliedAnnualRate)
impliedRate    = solveForRate(actualMonthlyLease, vehicleBaseValue, residual, termRemainingMonths)

// Benchmark payment at user-supplied market rate
benchmarkLease = pmt(benchmarkRate/12, termRemainingMonths, vehicleBaseValue, residual)

monthlyOvercharge = actualMonthlyLease - benchmarkLease
annualOvercharge  = monthlyOvercharge * 12
managementFeePercent = (monthlyManagementFee * 12) / vehicleBaseValue
```

**Newton-Raphson convergence:** Initial guess r₀ = 0.07/12. Iterate: rₙ₊₁ = rₙ − f(rₙ)/f′(rₙ) where f(r) = pmt(r, n, pv, fv) − target. Converges in <50 iterations for typical inputs. Returns `null` if |r| > 1 or doesn't converge in 200 iterations.

---

## 7. Component Reference

### 7.1 `<InputForm onCalculate={fn} />`
Renders all lease calculator inputs. Calls `onCalculate(LeaseInputs)` on submit.

Fields:
- Gross salary (number, $)
- State (select: NSW/VIC/QLD/SA/WA/TAS/ACT/NT)
- Vehicle cost (number, $)
- Vehicle type (select: BEV/PHEV/ICE)
- PHEV delivery date checkbox (shown only when PHEV selected)
- Interest rate (number, %)
- Lease term (select: 1–5 years)
- Residual: checkbox to override + optional custom % input. Shows ATO minimum as hint.
- Annual management fee (number, $)
- Running costs: fuel, registration, insurance, tyres, maintenance (all number, $)

### 7.2 `<ResultsPanel result={LeaseResult} />`
Displays calculation output in four section cards:
1. **Monthly Payments** — pre-tax, post-tax (if applicable), effective out-of-pocket
2. **Annual Breakdown** — itemised annual costs and tax saving
3. **Tax Details** — taxable income before/after, tax amounts, saving
4. **Lease Details** — base value, residual, monthly payment
5. **Upfront Costs** (conditional) — LCT and/or stamp duty if > $0

FBT status displayed as a colour-coded banner (green = exempt, amber = FBT applies).

### 7.3 `<AnalyserForm onAnalyse={fn} />`
Inputs: vehicle base value, remaining term (months), monthly pre-tax, monthly post-tax, monthly management fee, monthly running costs, benchmark rate (%).

### 7.4 `<AnalyserResults result={AnalyserResult} />`
Displays: implied interest rate, benchmark vs actual monthly lease, monthly/annual overcharge, management fee %, residual value. Colour-coded banner (red = overpaying, green = fair).

---

## 8. Deployment

### 8.1 GitHub Pages Setup

1. In GitHub repo settings → Pages → set source to `gh-pages` branch (auto-created by the workflow).
2. The site will be available at: `https://<username>.github.io/lease-calc/`

### 8.2 Vite Base Path

`vite.config.ts` must have:
```ts
base: '/lease-calc/'
```
This ensures asset paths work correctly on the GitHub Pages subdirectory.

### 8.3 GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 8.4 Local Development

```bash
npm install
npm run dev      # starts dev server at http://localhost:5173/lease-calc/
npm run build    # produces dist/
npm run preview  # serves dist/ locally
```

---

## 9. Extending the Calculator

### Adding a new tax year
Update `src/lib/constants.ts`:
- `TAX_BRACKETS` — new income tax brackets
- `MEDICARE_LOW_INCOME_THRESHOLD`
- `LITO_MAX` and phase-out values
- `LCT_THRESHOLD_FUEL_EFFICIENT` and `LCT_THRESHOLD_GENERAL`

### Adding a new state
Add a case to the `calculateStampDuty` switch in `constants.ts`, and add the state to `AustralianState` type in `types/index.ts`.

### Adding employer FBT exemption (charities/NFPs)
Some employers hold FBT exemption status (e.g. public hospitals, charities). For these, FBT is exempt regardless of vehicle type, up to a reportable fringe benefits cap ($30,000 grossed-up for most NFPs). To support this:
- Add `employerFbtExempt: boolean` to `LeaseInputs`
- Add `nfpCap: number` to `LeaseInputs` (default $30,000)
- In `isFbtExempt()`, return `true` if `employerFbtExempt && annualPreTaxBudget <= nfpCap`

---

## 10. ATO References

| Topic | ATO URL |
|-------|---------|
| Electric car FBT exemption | https://www.ato.gov.au/businesses-and-organisations/hiring-and-paying-your-workers/fringe-benefits-tax/types-of-fringe-benefits/fbt-on-cars-other-vehicles-parking-and-tolls/electric-cars-exemption |
| LCT thresholds | https://www.ato.gov.au/rates/luxury-car-tax-rate-and-thresholds/ |
| ATO residual values (safe harbour) | https://www.ato.gov.au/law/view/document?DocID=SAV/FBTGEMP/00008 |
| Income tax rates | https://www.ato.gov.au/rates/individual-income-tax-rates/ |
| FBT rates and thresholds | https://www.ato.gov.au/rates/fringe-benefits-tax-rates-and-thresholds/ |

---

## 11. Disclaimer

This calculator is for **educational and illustrative purposes only**. It does not constitute financial, tax, or legal advice. Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change. State stamp duty rates are approximate and should be verified with the relevant state revenue office. Always consult a qualified financial adviser or accountant before entering into a novated lease arrangement.
