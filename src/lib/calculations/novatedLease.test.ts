import { describe, it, expect } from 'vitest'
import { calculateNovatedLease, analyseExistingLease, calculateAllLeaseTerms } from './novatedLease'
import { pmt, atoResidualPercent } from './lease'
import { totalTax } from './tax'
import { ecmAnnualContribution } from './fbt'
import type { AnalyserInputs, MultiTermLeaseInputs } from '../../types'

// ── Shared base inputs ────────────────────────────────────────────────────────

const baseInputs: MultiTermLeaseInputs = {
  grossSalary: 120_000,
  vehicleCost: 60_000,
  vehicleType: 'BEV',         // FBT exempt (under $91,387, Phase 1)
  phevDeliveredBeforeApril2025: false,
  leaseStartDate: new Date('2026-06-01'), // Phase 1
  grandfatheredLease: false,
  interestRate: 0.07,
  showLoanComparison: false,
  loanComparisonRate: 0.08,
  loanComparisonResidual: 0,
  customResidualPercent: null, // uses ATO minimums per term
  annualManagementFee: 1_200,
  runningCosts: {
    fuel: 0,
    registration: 800,
    insurance: 1_500,
    tyres: 400,
    maintenance: 600,
  },
  state: 'NSW',
}

// ── calculateNovatedLease — FBT-exempt BEV ───────────────────────────────────

describe('calculateNovatedLease — FBT-exempt BEV', () => {
  it('marks the vehicle as fully FBT exempt', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.fbtExemptionStatus).toBe('full')
  })

  it('returns zero LCT for a BEV under the fuel-efficient threshold', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.lctApplied).toBe(0)
  })

  it('returns correct NSW stamp duty', () => {
    // $60,000 NSW: 1350 + (60000 - 45000) * 0.05 = 2100
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.stampDutyApplied).toBeCloseTo(2_100, 0)
  })

  it('uses the ATO 5-year residual percent when customResidualPercent is null', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.residualPercent).toBe(atoResidualPercent(5))
    expect(result.residualValue).toBeCloseTo(60_000 * atoResidualPercent(5), 2)
  })

  it('the entire budget is deducted pre-tax (no post-tax for FBT-exempt vehicle)', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.annualPostTaxDeduction).toBe(0)
    expect(result.monthlyPostTaxDeduction).toBe(0)
    expect(result.annualPreTaxDeduction).toBeGreaterThan(0)
  })

  it('pre-tax deduction equals total annual budget (lease + running + management)', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    const expectedBudget = result.annualLeasePayment + result.annualRunningCosts + result.annualManagementFee
    expect(result.annualPreTaxDeduction).toBeCloseTo(expectedBudget, 2)
  })

  it('running costs equal the sum of all running cost line items', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    const { fuel, registration, insurance, tyres, maintenance } = baseInputs.runningCosts
    expect(result.annualRunningCosts).toBe(fuel + registration + insurance + tyres + maintenance)
  })

  it('annual management fee is passed through unchanged', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.annualManagementFee).toBe(baseInputs.annualManagementFee)
  })

  it('annual lease payment = monthly × 12', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.annualLeasePayment).toBeCloseTo(result.monthlyLeasePayment * 12, 4)
  })

  it('monthly pre-tax deduction = annual / 12', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.monthlyPreTaxDeduction).toBeCloseTo(result.annualPreTaxDeduction / 12, 4)
  })

  it('tax saving equals the difference in total tax before and after sacrifice', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    const expected = totalTax(baseInputs.grossSalary) - totalTax(result.newTaxableIncome)
    expect(result.annualTaxSaving).toBeCloseTo(expected, 2)
  })

  it('new taxable income equals gross salary minus pre-tax deduction', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.newTaxableIncome).toBeCloseTo(
      baseInputs.grossSalary - result.annualPreTaxDeduction,
      2,
    )
  })

  it('net annual cost = pre-tax + post-tax deductions minus tax saving', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    const expected = result.annualPreTaxDeduction + result.annualPostTaxDeduction - result.annualTaxSaving
    expect(result.netAnnualCost).toBeCloseTo(expected, 2)
  })

  it('effective monthly out-of-pocket = net annual cost / 12', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.effectiveMonthlyOutOfPocket).toBeCloseTo(result.netAnnualCost / 12, 4)
  })

  it('effectiveBaseValue equals vehicleCost', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.effectiveBaseValue).toBe(baseInputs.vehicleCost)
  })

  it('showLoanComparison is passed through from inputs', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.showLoanComparison).toBe(false)
  })

  it('termYears is included in result', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.termYears).toBe(5)
  })

  it('interestCost is positive', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.interestCost).toBeGreaterThan(0)
  })

  it('grossSalary is included in result', () => {
    const result = calculateNovatedLease(baseInputs, 5)
    expect(result.grossSalary).toBe(baseInputs.grossSalary)
  })
})

// ── calculateNovatedLease — ICE (FBT not exempt, ECM applies) ─────────────────

describe('calculateNovatedLease — ICE vehicle with ECM', () => {
  const iceInputs = { ...baseInputs, vehicleType: 'ICE' as const }

  it('marks the vehicle as NOT FBT exempt', () => {
    const result = calculateNovatedLease(iceInputs, 5)
    expect(result.fbtExemptionStatus).toBe('none')
  })

  it('splits the budget into pre-tax and post-tax (ECM) deductions', () => {
    const result = calculateNovatedLease(iceInputs, 5)
    expect(result.annualPostTaxDeduction).toBeGreaterThan(0)
    expect(result.annualPreTaxDeduction).toBeGreaterThan(0)
  })

  it('post-tax ECM deduction equals vehicleCost × 20% (statutory fraction)', () => {
    const result = calculateNovatedLease(iceInputs, 5)
    const expectedEcm = ecmAnnualContribution(baseInputs.vehicleCost, 'none')
    expect(result.annualPostTaxDeduction).toBeCloseTo(expectedEcm, 2)
  })

  it('pre-tax + post-tax deductions equal total annual budget', () => {
    const result = calculateNovatedLease(iceInputs, 5)
    const totalBudget = result.annualLeasePayment + result.annualRunningCosts + result.annualManagementFee
    expect(result.annualPreTaxDeduction + result.annualPostTaxDeduction).toBeCloseTo(totalBudget, 2)
  })

  it('post-tax deduction is capped at the total annual budget', () => {
    const result = calculateNovatedLease(iceInputs, 5)
    const totalBudget = result.annualLeasePayment + result.annualRunningCosts + result.annualManagementFee
    expect(result.annualPostTaxDeduction).toBeLessThanOrEqual(totalBudget + 0.01)
  })

  it('ICE returns zero LCT (vehicle is under the general threshold)', () => {
    // $60,000 < $76,950 general threshold
    const result = calculateNovatedLease(iceInputs, 5)
    expect(result.lctApplied).toBe(0)
  })

  it('ICE has higher net annual cost than equivalent BEV (less tax benefit, post-tax required)', () => {
    const bevResult = calculateNovatedLease(baseInputs, 5)
    const iceResult = calculateNovatedLease(iceInputs, 5)
    expect(iceResult.netAnnualCost).toBeGreaterThan(bevResult.netAnnualCost)
  })
})

// ── calculateNovatedLease — LCT applied ───────────────────────────────────────

describe('calculateNovatedLease — LCT on expensive vehicle', () => {
  it('applies LCT for an ICE vehicle above the general threshold', () => {
    const result = calculateNovatedLease({ ...baseInputs, vehicleType: 'ICE', vehicleCost: 90_000 }, 5)
    expect(result.lctApplied).toBeGreaterThan(0)
  })

  it('applies LCT for a BEV above the fuel-efficient threshold', () => {
    const result = calculateNovatedLease({ ...baseInputs, vehicleType: 'BEV', vehicleCost: 95_000 }, 5)
    expect(result.lctApplied).toBeGreaterThan(0)
    expect(result.fbtExemptionStatus).toBe('none')
  })
})

// ── calculateNovatedLease — Custom residual ───────────────────────────────────

describe('calculateNovatedLease — custom residual percent', () => {
  it('uses the custom residual when provided', () => {
    const customPercent = 0.35
    const result = calculateNovatedLease({ ...baseInputs, customResidualPercent: customPercent }, 5)
    expect(result.residualPercent).toBe(customPercent)
    expect(result.residualValue).toBeCloseTo(baseInputs.vehicleCost * customPercent, 2)
  })

  it('lower residual results in higher monthly lease payment', () => {
    const highResidual = calculateNovatedLease({ ...baseInputs, customResidualPercent: 0.40 }, 5)
    const lowResidual = calculateNovatedLease({ ...baseInputs, customResidualPercent: 0.20 }, 5)
    expect(lowResidual.monthlyLeasePayment).toBeGreaterThan(highResidual.monthlyLeasePayment)
  })
})

// ── calculateNovatedLease — term year residuals ───────────────────────────────

describe('calculateNovatedLease — term year residuals', () => {
  it('uses ATO residual for each supported term (1–5 years)', () => {
    for (const termYears of [1, 2, 3, 4, 5] as const) {
      const result = calculateNovatedLease(baseInputs, termYears)
      expect(result.residualPercent).toBe(atoResidualPercent(termYears))
      expect(result.termYears).toBe(termYears)
    }
  })
})

// ── calculateNovatedLease — loan comparison ───────────────────────────────────

describe('calculateNovatedLease — loan comparison', () => {
  it('comparison fields are present regardless of showLoanComparison', () => {
    const result = calculateNovatedLease({ ...baseInputs, showLoanComparison: false }, 5)
    expect(result.comparisonMonthlyLoanPayment).toBeGreaterThan(0)
    expect(result.comparisonMonthlyTotal).toBeGreaterThan(0)
    expect(result.comparisonAnnualTotal).toBeCloseTo(result.comparisonMonthlyTotal * 12, 2)
  })

  it('annual saving vs loan = comparison annual total minus net annual cost', () => {
    const result = calculateNovatedLease({ ...baseInputs, showLoanComparison: true }, 5)
    expect(result.annualSavingVsLoan).toBeCloseTo(
      result.comparisonAnnualTotal - result.netAnnualCost,
      2,
    )
  })

  it('comparison monthly total includes running costs', () => {
    const result = calculateNovatedLease({ ...baseInputs, showLoanComparison: true }, 5)
    expect(result.comparisonMonthlyTotal).toBeCloseTo(
      result.comparisonMonthlyLoanPayment + result.annualRunningCosts / 12,
      4,
    )
  })

  it('loanComparisonRate is passed through to result', () => {
    const result = calculateNovatedLease({ ...baseInputs, loanComparisonRate: 0.09 }, 5)
    expect(result.loanComparisonRate).toBe(0.09)
  })

  it('BEV novated lease saves money vs personal loan', () => {
    const result = calculateNovatedLease({ ...baseInputs, showLoanComparison: true }, 5)
    expect(result.annualSavingVsLoan).toBeGreaterThan(0)
  })
})

// ── calculateNovatedLease — state stamp duty variation ────────────────────────

describe('calculateNovatedLease — state stamp duty', () => {
  it('ACT BEV has zero stamp duty', () => {
    const result = calculateNovatedLease({ ...baseInputs, state: 'ACT' }, 5)
    expect(result.stampDutyApplied).toBe(0)
  })

  it('VIC BEV pays lower stamp duty than VIC ICE', () => {
    const bev = calculateNovatedLease({ ...baseInputs, state: 'VIC', vehicleType: 'BEV' }, 5)
    const ice = calculateNovatedLease({ ...baseInputs, state: 'VIC', vehicleType: 'ICE' }, 5)
    expect(bev.stampDutyApplied).toBeLessThan(ice.stampDutyApplied)
  })
})

// ── calculateAllLeaseTerms ────────────────────────────────────────────────────

describe('calculateAllLeaseTerms', () => {
  it('returns an array of 5 results', () => {
    const results = calculateAllLeaseTerms(baseInputs)
    expect(results).toHaveLength(5)
  })

  it('each result has the correct termYears (1–5)', () => {
    const results = calculateAllLeaseTerms(baseInputs)
    results.forEach((r, i) => expect(r.termYears).toBe(i + 1))
  })

  it('residual percents match ATO table for each term', () => {
    const results = calculateAllLeaseTerms(baseInputs)
    results.forEach(r => expect(r.residualPercent).toBe(atoResidualPercent(r.termYears)))
  })

  it('all results have positive interestCost', () => {
    const results = calculateAllLeaseTerms(baseInputs)
    results.forEach(r => expect(r.interestCost).toBeGreaterThan(0))
  })

  it('longer terms have lower monthly payments (decreasing monthly payment)', () => {
    const results = calculateAllLeaseTerms(baseInputs)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i]!.monthlyLeasePayment).toBeGreaterThan(results[i + 1]!.monthlyLeasePayment)
    }
  })
})

// ── calculateNovatedLease — Phase 2 partial exemption ─────────────────────────

describe('calculateNovatedLease — Phase 2 BEV with partial exemption', () => {
  // BEV priced above $75k in Phase 2 (from 1 Apr 2027): 25% exempt, 75% FBT payable
  const phase2Inputs: MultiTermLeaseInputs = {
    ...baseInputs,
    vehicleCost: 80_000,
    leaseStartDate: new Date('2027-06-01'), // Phase 2
  }

  it('returns partial exemption status for a $80k BEV in Phase 2', () => {
    const result = calculateNovatedLease(phase2Inputs, 5)
    expect(result.fbtExemptionStatus).toBe('partial')
  })

  it('has a non-zero post-tax ECM deduction (reduced vs fully non-exempt)', () => {
    const result = calculateNovatedLease(phase2Inputs, 5)
    expect(result.annualPostTaxDeduction).toBeGreaterThan(0)
    // Partial ECM = 75% of full ECM
    const fullEcm = ecmAnnualContribution(phase2Inputs.vehicleCost, 'none')
    const partialEcm = ecmAnnualContribution(phase2Inputs.vehicleCost, 'partial')
    expect(result.annualPostTaxDeduction).toBeCloseTo(partialEcm, 2)
    expect(result.annualPostTaxDeduction).toBeLessThan(fullEcm)
  })

  it('partial exemption BEV has higher net cost than fully exempt BEV but lower than ICE', () => {
    const fullyExempt = calculateNovatedLease({ ...phase2Inputs, vehicleCost: 60_000 }, 5)
    const partialExempt = calculateNovatedLease(phase2Inputs, 5)
    const nonExempt = calculateNovatedLease({ ...phase2Inputs, vehicleType: 'ICE' }, 5)
    expect(partialExempt.netAnnualCost).toBeGreaterThan(fullyExempt.netAnnualCost)
    expect(partialExempt.netAnnualCost).toBeLessThan(nonExempt.netAnnualCost)
  })

  it('has no phase warning for a Phase 1 lease (all pre-Apr 2027 leases are grandfathered)', () => {
    const phase1Lease = calculateNovatedLease({
      ...baseInputs,
      leaseStartDate: new Date('2026-06-01'),
    }, 5)
    expect(phase1Lease.fbtPhaseWarning).toBeNull()
  })

  it('includes a phase-crossing warning for a Phase 2 lease that spans into Phase 3', () => {
    const phase2LongLease = calculateNovatedLease({
      ...baseInputs,
      leaseStartDate: new Date('2027-06-01'), // Phase 2
    }, 3) // 3-year lease ending Jun 2030 — crosses Phase 3 (Apr 2029)
    expect(phase2LongLease.fbtPhaseWarning).not.toBeNull()
  })

  it('has no phase warning for a grandfathered lease', () => {
    const result = calculateNovatedLease({ ...phase2Inputs, grandfatheredLease: true }, 5)
    expect(result.fbtPhaseWarning).toBeNull()
    expect(result.fbtExemptionStatus).toBe('full')
  })
})

// ── analyseExistingLease ──────────────────────────────────────────────────────

const baseAnalyserInputs: AnalyserInputs = {
  vehicleBaseValue: 50_000,
  termRemainingMonths: 36,    // 3 years → ATO residual 0.4688
  monthlyPreTax: 1_500,
  monthlyManagementFee: 100,
  monthlyRunningCosts: 200,
  benchmarkRate: 0.07,
}

describe('analyseExistingLease', () => {
  it('isolates the actual monthly lease payment (subtracts fees and running costs)', () => {
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.actualMonthlyLease).toBeCloseTo(
      baseAnalyserInputs.monthlyPreTax
      - baseAnalyserInputs.monthlyManagementFee
      - baseAnalyserInputs.monthlyRunningCosts,
      4,
    )
  })

  it('annual overcharge equals monthly overcharge × 12', () => {
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.annualOvercharge).toBeCloseTo(result.monthlyOvercharge * 12, 4)
  })

  it('annual management fee equals monthly fee × 12', () => {
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.annualManagementFee).toBeCloseTo(baseAnalyserInputs.monthlyManagementFee * 12, 2)
  })

  it('management fee percent equals annualFee / vehicleBaseValue', () => {
    const result = analyseExistingLease(baseAnalyserInputs)
    const expected = (baseAnalyserInputs.monthlyManagementFee * 12) / baseAnalyserInputs.vehicleBaseValue
    expect(result.managementFeePercent).toBeCloseTo(expected, 6)
  })

  it('passes the benchmark rate through to the result', () => {
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.benchmarkRate).toBe(baseAnalyserInputs.benchmarkRate)
  })

  it('residual value uses ATO table rounded to nearest year', () => {
    // 36 months → round(36/12) = 3 years → ATO residual 0.4688
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.residualValue).toBeCloseTo(50_000 * atoResidualPercent(3), 2)
  })

  it('returns a non-null implied rate for a valid lease payment', () => {
    // A realistic payment should converge to a valid rate
    const result = analyseExistingLease(baseAnalyserInputs)
    expect(result.impliedInterestRate).not.toBeNull()
  })

  it('implied rate is higher than benchmark when actual payment exceeds benchmark', () => {
    // actualMonthlyLease = 1200 (plausibly above benchmark at 7%)
    const result = analyseExistingLease(baseAnalyserInputs)
    if (result.monthlyOvercharge > 0 && result.impliedInterestRate !== null) {
      expect(result.impliedInterestRate).toBeGreaterThan(baseAnalyserInputs.benchmarkRate)
    }
  })

  it('overcharge is zero when actual payment equals benchmark payment', () => {
    // Compute the exact benchmark payment and pass it as the total pre-tax
    const residual = 50_000 * atoResidualPercent(3)
    const benchmarkMonthly = pmt(0.07 / 12, 36, 50_000, residual)
    const totalPreTax = benchmarkMonthly
      + baseAnalyserInputs.monthlyManagementFee
      + baseAnalyserInputs.monthlyRunningCosts
    const result = analyseExistingLease({
      ...baseAnalyserInputs,
      monthlyPreTax: totalPreTax,
    })
    expect(result.monthlyOvercharge).toBeCloseTo(0, 4)
    expect(result.annualOvercharge).toBeCloseTo(0, 4)
  })

  it('handles zero vehicle base value without crashing (managementFeePercent = 0)', () => {
    const result = analyseExistingLease({ ...baseAnalyserInputs, vehicleBaseValue: 0 })
    expect(result.managementFeePercent).toBe(0)
  })

  it('maps short remaining terms to 1-year ATO residual (minimum)', () => {
    // 3 months remaining → round(3/12) = 0 → clamped to 1
    const result = analyseExistingLease({ ...baseAnalyserInputs, termRemainingMonths: 3 })
    expect(result.residualValue).toBeCloseTo(50_000 * atoResidualPercent(1), 2)
  })

  it('maps long remaining terms to 5-year ATO residual (maximum)', () => {
    // 72 months remaining → round(72/12) = 6 → clamped to 5
    const result = analyseExistingLease({ ...baseAnalyserInputs, termRemainingMonths: 72 })
    expect(result.residualValue).toBeCloseTo(50_000 * atoResidualPercent(5), 2)
  })
})
