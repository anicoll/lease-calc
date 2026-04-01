import { describe, it, expect } from 'vitest'
import { pmt, atoResidualPercent, residualValue, lct, impliedAnnualRate } from './lease'
import { ATO_RESIDUALS, LCT_THRESHOLD_FUEL_EFFICIENT, LCT_THRESHOLD_GENERAL, LCT_RATE } from '../constants'

// ── pmt ───────────────────────────────────────────────────────────────────────

describe('pmt', () => {
  it('returns (pv - fv) / n when interest rate is zero', () => {
    expect(pmt(0, 48, 40_000, 10_000)).toBeCloseTo(625, 5)
  })

  it('returns (pv - fv) / n for any fv when rate is zero', () => {
    const result = pmt(0, 60, 50_000, 0)
    expect(result).toBeCloseTo(50_000 / 60, 5)
  })

  it('returns a positive payment for positive pv greater than fv', () => {
    const result = pmt(0.07 / 12, 60, 50_000, 10_000)
    expect(result).toBeGreaterThan(0)
  })

  it('gives higher monthly payment at higher interest rate', () => {
    const low = pmt(0.05 / 12, 60, 50_000, 10_000)
    const high = pmt(0.10 / 12, 60, 50_000, 10_000)
    expect(high).toBeGreaterThan(low)
  })

  it('gives higher monthly payment with shorter term', () => {
    const longTerm = pmt(0.07 / 12, 60, 50_000, 10_000)
    const shortTerm = pmt(0.07 / 12, 36, 50_000, 10_000)
    expect(shortTerm).toBeGreaterThan(longTerm)
  })

  it('matches known standard PMT value (7% pa, 60 months, $50k pv, $0 fv)', () => {
    // Standard annuity: round number check
    const result = pmt(0.07 / 12, 60, 50_000, 0)
    // Known approximate value for 7% 60-month loan on $50k
    expect(result).toBeCloseTo(990.06, 0)
  })

  it('returns lower payment when fv (residual) is higher', () => {
    const noResidual = pmt(0.07 / 12, 60, 50_000, 0)
    const withResidual = pmt(0.07 / 12, 60, 50_000, 15_000)
    expect(withResidual).toBeLessThan(noResidual)
  })
})

// ── atoResidualPercent ────────────────────────────────────────────────────────

describe('atoResidualPercent', () => {
  it('returns correct residual for 1-year term', () => {
    expect(atoResidualPercent(1)).toBe(ATO_RESIDUALS[1])
    expect(atoResidualPercent(1)).toBeCloseTo(0.6563, 4)
  })

  it('returns correct residual for 2-year term', () => {
    expect(atoResidualPercent(2)).toBe(ATO_RESIDUALS[2])
    expect(atoResidualPercent(2)).toBeCloseTo(0.5625, 4)
  })

  it('returns correct residual for 3-year term', () => {
    expect(atoResidualPercent(3)).toBe(ATO_RESIDUALS[3])
    expect(atoResidualPercent(3)).toBeCloseTo(0.4688, 4)
  })

  it('returns correct residual for 4-year term', () => {
    expect(atoResidualPercent(4)).toBe(ATO_RESIDUALS[4])
    expect(atoResidualPercent(4)).toBeCloseTo(0.3750, 4)
  })

  it('returns correct residual for 5-year term', () => {
    expect(atoResidualPercent(5)).toBe(ATO_RESIDUALS[5])
    expect(atoResidualPercent(5)).toBeCloseTo(0.2813, 4)
  })

  it('clamps to 5-year rate for out-of-range term above 5', () => {
    expect(atoResidualPercent(6)).toBe(ATO_RESIDUALS[5])
    expect(atoResidualPercent(10)).toBe(ATO_RESIDUALS[5])
  })

  it('clamps to 5-year rate for term of 0', () => {
    expect(atoResidualPercent(0)).toBe(ATO_RESIDUALS[5])
  })
})

// ── residualValue ─────────────────────────────────────────────────────────────

describe('residualValue', () => {
  it('returns vehicle cost times residual percent', () => {
    expect(residualValue(60_000, 0.2813)).toBeCloseTo(16_878, 2)
  })

  it('returns zero when residual percent is zero', () => {
    expect(residualValue(60_000, 0)).toBe(0)
  })

  it('returns full vehicle cost when residual percent is 1', () => {
    expect(residualValue(60_000, 1)).toBe(60_000)
  })

  it('scales proportionally with vehicle cost', () => {
    const rate = 0.4688
    expect(residualValue(40_000, rate)).toBeCloseTo(residualValue(80_000, rate) / 2, 5)
  })
})

// ── lct ───────────────────────────────────────────────────────────────────────

describe('lct', () => {
  it('returns 0 for BEV at exactly the fuel-efficient threshold', () => {
    expect(lct(LCT_THRESHOLD_FUEL_EFFICIENT, 'BEV')).toBe(0)
  })

  it('returns 0 for BEV below the fuel-efficient threshold', () => {
    expect(lct(60_000, 'BEV')).toBe(0)
  })

  it('returns positive LCT for BEV above the fuel-efficient threshold', () => {
    const result = lct(100_000, 'BEV')
    const expected = ((100_000 - LCT_THRESHOLD_FUEL_EFFICIENT) / 1.1) * LCT_RATE
    expect(result).toBeCloseTo(expected, 2)
  })

  it('returns 0 for ICE at exactly the general threshold', () => {
    expect(lct(LCT_THRESHOLD_GENERAL, 'ICE')).toBe(0)
  })

  it('returns 0 for ICE below the general threshold', () => {
    expect(lct(60_000, 'ICE')).toBe(0)
  })

  it('returns positive LCT for ICE above the general threshold', () => {
    const result = lct(80_000, 'ICE')
    const expected = ((80_000 - LCT_THRESHOLD_GENERAL) / 1.1) * LCT_RATE
    expect(result).toBeCloseTo(expected, 2)
  })

  it('PHEV uses fuel-efficient threshold (higher), not general', () => {
    // $80k: above ICE threshold but below PHEV threshold
    expect(lct(80_000, 'PHEV')).toBe(0)
    // $100k: above PHEV threshold
    const result = lct(100_000, 'PHEV')
    const expected = ((100_000 - LCT_THRESHOLD_FUEL_EFFICIENT) / 1.1) * LCT_RATE
    expect(result).toBeCloseTo(expected, 2)
  })

  it('ICE LCT is non-zero at price where BEV/PHEV LCT is still zero', () => {
    const price = 80_000 // above ICE threshold (76,950), below BEV threshold (91,387)
    expect(lct(price, 'ICE')).toBeGreaterThan(0)
    expect(lct(price, 'BEV')).toBe(0)
    expect(lct(price, 'PHEV')).toBe(0)
  })

  it('LCT scales linearly with vehicle cost above threshold', () => {
    const a = lct(95_000, 'BEV')
    const b = lct(105_000, 'BEV')
    // Additional $10k at same rate → LCT diff should be (10000/1.1)*0.33
    expect(b - a).toBeCloseTo((10_000 / 1.1) * LCT_RATE, 2)
  })
})

// ── impliedAnnualRate ─────────────────────────────────────────────────────────

describe('impliedAnnualRate', () => {
  it('recovers a known annual rate from a PMT-derived payment', () => {
    const knownRate = 0.07
    const vehicleCost = 50_000
    const residual = 14_065
    const termMonths = 60
    const payment = pmt(knownRate / 12, termMonths, vehicleCost, residual)
    const implied = impliedAnnualRate(payment, vehicleCost, residual, termMonths)
    expect(implied).not.toBeNull()
    expect(implied!).toBeCloseTo(knownRate, 4)
  })

  it('recovers a high interest rate', () => {
    const knownRate = 0.12
    const vehicleCost = 40_000
    const residual = 15_000
    const termMonths = 48
    const payment = pmt(knownRate / 12, termMonths, vehicleCost, residual)
    const implied = impliedAnnualRate(payment, vehicleCost, residual, termMonths)
    expect(implied).not.toBeNull()
    expect(implied!).toBeCloseTo(knownRate, 4)
  })

  it('recovers a low interest rate', () => {
    const knownRate = 0.03
    const vehicleCost = 60_000
    const residual = 20_000
    const termMonths = 36
    const payment = pmt(knownRate / 12, termMonths, vehicleCost, residual)
    const implied = impliedAnnualRate(payment, vehicleCost, residual, termMonths)
    expect(implied).not.toBeNull()
    expect(implied!).toBeCloseTo(knownRate, 4)
  })

  it('returns null for an impossible payment (payment is negative)', () => {
    // A payment less than zero is financially impossible for a standard lease
    const result = impliedAnnualRate(-1_000, 50_000, 14_065, 60)
    expect(result).toBeNull()
  })
})
