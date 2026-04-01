import { describe, it, expect } from 'vitest'
import { calculateEarlyTermination, daysInFbtYear } from './earlyTermination'
import type { EarlyTerminationInputs } from '../../types'

// Base inputs shared across tests — ICE vehicle so FBT is not exempt
const base: EarlyTerminationInputs = {
  vehicleBaseValue: 65_000,
  annualInterestRate: 0.075,
  originalTermMonths: 60,
  monthsElapsed: 24,
  residualValue: 65_000 * 0.2813, // 5-year ATO minimum
  monthlyLeasePayment: null,
  monthlyManagementFee: 0,
  terminationFee: 0,
  currentMarketValue: null,
  vehicleType: 'ICE',
  phevDeliveredBeforeApril2025: false,
  terminationDate: new Date('2025-10-15'), // mid FBT year (Apr 2025 – Mar 2026)
}

// ── daysInFbtYear ─────────────────────────────────────────────────────────────

describe('daysInFbtYear', () => {
  it('counts days from FBT year start when lease predates it', () => {
    // Termination: Oct 15 2025 (mid-year). Lease started 24 months prior = Oct 2023.
    // FBT year started Apr 1 2025. periodStart = Apr 1 2025.
    // Expected: Apr 1 → Oct 15 = 197 days.
    const days = daysInFbtYear(new Date('2025-10-15'), 24)
    expect(days).toBe(197)
  })

  it('counts days from lease start when lease began after FBT year start', () => {
    // Termination: Oct 15 2025. Lease started 3 months prior = Jul 15 2025.
    // FBT year started Apr 1 2025. periodStart = Jul 15 2025 (later).
    // Expected: Jul 15 → Oct 15 = 92 days.
    const days = daysInFbtYear(new Date('2025-10-15'), 3)
    expect(days).toBe(92)
  })

  it('returns 0 when terminating on April 1 (start of new FBT year)', () => {
    // FBT year just rolled over — 0 days used in the new year.
    const days = daysInFbtYear(new Date('2026-04-01'), 24)
    expect(days).toBe(0)
  })

  it('handles termination in Jan–Mar (still in prior FBT year)', () => {
    // Termination: Feb 28 2026. month = 1, so fbtYearStart = Apr 1 2025.
    // Lease started 24 months prior = Feb 2024. periodStart = Apr 1 2025.
    // Expected: Apr 1 2025 → Feb 28 2026 = 333 days.
    const days = daysInFbtYear(new Date('2026-02-28'), 24)
    expect(days).toBe(333)
  })

  it('returns 0 when lease started after termination (monthsElapsed > term)', () => {
    // Edge case: 0 months elapsed means lease started today.
    const days = daysInFbtYear(new Date('2025-10-15'), 0)
    expect(days).toBe(0)
  })
})

// ── FBT exemption ─────────────────────────────────────────────────────────────

describe('FBT exemption', () => {
  it('BEV under LCT threshold is always exempt', () => {
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'BEV',
      vehicleBaseValue: 65_000, // under $91,387 threshold
    })
    expect(result.fbtExempt).toBe(true)
    expect(result.partialYearFbtPayable).toBe(0)
  })

  it('BEV over LCT threshold is not exempt', () => {
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'BEV',
      vehicleBaseValue: 95_000, // over $91,387 threshold
    })
    expect(result.fbtExempt).toBe(false)
    expect(result.partialYearFbtPayable).toBeGreaterThan(0)
  })

  it('PHEV delivered before Apr 2025 under threshold is exempt', () => {
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'PHEV',
      phevDeliveredBeforeApril2025: true,
      vehicleBaseValue: 65_000,
    })
    expect(result.fbtExempt).toBe(true)
    expect(result.partialYearFbtPayable).toBe(0)
  })

  it('PHEV delivered after Apr 2025 is not exempt', () => {
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'PHEV',
      phevDeliveredBeforeApril2025: false,
      vehicleBaseValue: 65_000,
    })
    expect(result.fbtExempt).toBe(false)
    expect(result.partialYearFbtPayable).toBeGreaterThan(0)
  })

  it('ICE vehicle is never exempt', () => {
    const result = calculateEarlyTermination({ ...base, vehicleType: 'ICE' })
    expect(result.fbtExempt).toBe(false)
    expect(result.partialYearFbtPayable).toBeGreaterThan(0)
  })
})

// ── FBT amount ────────────────────────────────────────────────────────────────

describe('partial-year FBT calculation', () => {
  it('FBT is zero when terminating on April 1 (0 days in new FBT year)', () => {
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'ICE',
      terminationDate: new Date('2026-04-01'),
    })
    expect(result.fbtExempt).toBe(false)
    expect(result.daysUsedInFbtYear).toBe(0)
    expect(result.partialYearFbtPayable).toBe(0)
  })

  it('FBT is non-zero for ICE vehicle mid-FBT year', () => {
    // Oct 15 2025: 197 days since Apr 1 2025
    // Annual FBT = 65000 × 0.20 × 2.0802 × 0.47 = 12,709.62
    // Prorated = 12,709.62 × (197/365) = 6,857.xx
    const result = calculateEarlyTermination({ ...base, vehicleType: 'ICE' })
    expect(result.fbtExempt).toBe(false)
    expect(result.daysUsedInFbtYear).toBe(197)
    expect(result.partialYearFbtPayable).toBeCloseTo(6_857, -1)
  })

  it('full-year FBT for 365 days matches statutory formula', () => {
    // If 365 days elapsed, partialYearFbt = annualFbt × 1 = baseValue × 0.20 × 2.0802 × 0.47
    const baseValue = 65_000
    const expectedAnnual = baseValue * 0.20 * 2.0802 * 0.47
    // Use a date 365 days into FBT year: Apr 1 2025 + 365 = Apr 1 2026
    // But Apr 1 2026 would give 0 days in the NEW year — use Mar 31 instead
    // Mar 31 is month 2 (<3), so fbtYearStart = Apr 1 2025
    // Lease started 60 months ago, well before Apr 2025; periodStart = Apr 1 2025
    // days = Mar 31 2026 - Apr 1 2025 = 364 days
    const result = calculateEarlyTermination({
      ...base,
      vehicleType: 'ICE',
      terminationDate: new Date('2026-03-31'),
      monthsElapsed: 60,
    })
    expect(result.daysUsedInFbtYear).toBe(364)
    expect(result.partialYearFbtPayable).toBeCloseTo(expectedAnnual * (364 / 365), 0)
  })
})

// ── Finance payout ────────────────────────────────────────────────────────────

describe('finance payout', () => {
  it('payout equals residual when no months remain', () => {
    const residual = 65_000 * 0.2813
    const result = calculateEarlyTermination({
      ...base,
      monthsElapsed: 60,
      originalTermMonths: 60,
      residualValue: residual,
    })
    expect(result.monthsRemaining).toBe(0)
    expect(result.financePayout).toBeCloseTo(residual, 0)
  })

  it('payout is greater than residual when months remain', () => {
    const result = calculateEarlyTermination(base)
    expect(result.monthsRemaining).toBe(36)
    expect(result.financePayout).toBeGreaterThan(base.residualValue)
  })

  it('supplied monthly payment is used instead of derived', () => {
    const withDerived = calculateEarlyTermination(base)
    const withSupplied = calculateEarlyTermination({
      ...base,
      monthlyLeasePayment: withDerived.derivedMonthlyPayment,
    })
    expect(withSupplied.financePayout).toBeCloseTo(withDerived.financePayout, 0)
  })

  it('zero interest rate uses simple arithmetic', () => {
    const monthlyPayment = 1_000
    const residual = 10_000
    const result = calculateEarlyTermination({
      ...base,
      annualInterestRate: 0,
      monthlyLeasePayment: monthlyPayment,
      residualValue: residual,
      monthsElapsed: 24,
      originalTermMonths: 60,
    })
    // payout = 1000 × 36 + 10000 = 46000
    expect(result.financePayout).toBeCloseTo(46_000, 0)
  })
})

// ── Management fees and termination fee ──────────────────────────────────────

describe('management fees and termination fee', () => {
  it('remaining management fees = monthly fee × months remaining', () => {
    const result = calculateEarlyTermination({
      ...base,
      monthlyManagementFee: 100,
    })
    expect(result.remainingManagementFees).toBe(3_600) // 100 × 36 months
  })

  it('termination fee is passed through to result', () => {
    const result = calculateEarlyTermination({
      ...base,
      terminationFee: 750,
    })
    expect(result.terminationFee).toBe(750)
  })

  it('both fees are included in total financial exposure', () => {
    const withFees = calculateEarlyTermination({
      ...base,
      currentMarketValue: 40_000,
      monthlyManagementFee: 100,
      terminationFee: 750,
    })
    const withoutFees = calculateEarlyTermination({
      ...base,
      currentMarketValue: 40_000,
    })
    const expectedDiff = 3_600 + 750 // management fees + termination fee
    expect(withFees.totalFinancialExposure! - withoutFees.totalFinancialExposure!).toBeCloseTo(expectedDiff, 0)
  })
})

// ── Vehicle equity ────────────────────────────────────────────────────────────

describe('vehicle equity', () => {
  it('equity and total exposure are null when no market value supplied', () => {
    const result = calculateEarlyTermination(base)
    expect(result.vehicleEquity).toBeNull()
    expect(result.isUnderwater).toBeNull()
    expect(result.totalFinancialExposure).toBeNull()
  })

  it('positive equity when market value exceeds payout', () => {
    const result = calculateEarlyTermination({
      ...base,
      currentMarketValue: 60_000,
    })
    expect(result.vehicleEquity).toBeGreaterThan(0)
    expect(result.isUnderwater).toBe(false)
  })

  it('negative equity (underwater) when payout exceeds market value', () => {
    const result = calculateEarlyTermination({
      ...base,
      currentMarketValue: 20_000,
    })
    expect(result.vehicleEquity).toBeLessThan(0)
    expect(result.isUnderwater).toBe(true)
  })

  it('positive equity offsets total financial exposure', () => {
    const result = calculateEarlyTermination({
      ...base,
      currentMarketValue: 60_000,
      vehicleType: 'ICE',
    })
    // exposure = payout + fbt - equity (equity is positive so it reduces exposure)
    const expected = result.financePayout + result.partialYearFbtPayable - result.vehicleEquity!
    expect(result.totalFinancialExposure!).toBeCloseTo(expected, 0)
  })

  it('negative equity does not reduce total financial exposure below payout + fbt', () => {
    const result = calculateEarlyTermination({
      ...base,
      currentMarketValue: 20_000,
      vehicleType: 'ICE',
    })
    // equity is negative; equityOffset = max(0, equity) = 0; doesn't reduce exposure
    const expected = result.financePayout + result.partialYearFbtPayable
    expect(result.totalFinancialExposure!).toBeCloseTo(expected, 0)
  })
})
