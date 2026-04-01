import { describe, it, expect } from 'vitest'
import { isFbtExempt, fbtPayable, ecmAnnualContribution } from './fbt'
import {
  FBT_RATE,
  FBT_STATUTORY_FRACTION,
  FBT_TYPE2_GROSS_UP,
  LCT_THRESHOLD_FUEL_EFFICIENT,
} from '../constants'

// ── isFbtExempt ───────────────────────────────────────────────────────────────

describe('isFbtExempt', () => {
  describe('BEV', () => {
    it('is exempt when cost is below the fuel-efficient LCT threshold', () => {
      expect(isFbtExempt('BEV', 60_000, false)).toBe(true)
    })

    it('is exempt at exactly the fuel-efficient LCT threshold', () => {
      expect(isFbtExempt('BEV', LCT_THRESHOLD_FUEL_EFFICIENT, false)).toBe(true)
    })

    it('is NOT exempt when cost exceeds the fuel-efficient LCT threshold', () => {
      expect(isFbtExempt('BEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, false)).toBe(false)
      expect(isFbtExempt('BEV', 95_000, false)).toBe(false)
    })

    it('exemption is independent of phevDeliveredBeforeApril2025 flag', () => {
      expect(isFbtExempt('BEV', 60_000, true)).toBe(true)
      expect(isFbtExempt('BEV', 60_000, false)).toBe(true)
    })
  })

  describe('PHEV', () => {
    it('is exempt when delivered before Apr 2025 AND cost is under threshold', () => {
      expect(isFbtExempt('PHEV', 60_000, true)).toBe(true)
    })

    it('is NOT exempt when delivered after Apr 2025 regardless of cost', () => {
      expect(isFbtExempt('PHEV', 60_000, false)).toBe(false)
      expect(isFbtExempt('PHEV', 30_000, false)).toBe(false)
    })

    it('is NOT exempt when cost exceeds threshold even if delivered before Apr 2025', () => {
      expect(isFbtExempt('PHEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, true)).toBe(false)
      expect(isFbtExempt('PHEV', 95_000, true)).toBe(false)
    })

    it('is exempt at exactly the threshold when delivered before Apr 2025', () => {
      expect(isFbtExempt('PHEV', LCT_THRESHOLD_FUEL_EFFICIENT, true)).toBe(true)
    })
  })

  describe('ICE', () => {
    it('is never exempt regardless of cost', () => {
      expect(isFbtExempt('ICE', 30_000, false)).toBe(false)
      expect(isFbtExempt('ICE', 60_000, false)).toBe(false)
      expect(isFbtExempt('ICE', 120_000, false)).toBe(false)
    })

    it('is never exempt regardless of phevDeliveredBeforeApril2025 flag', () => {
      expect(isFbtExempt('ICE', 60_000, true)).toBe(false)
    })
  })
})

// ── fbtPayable ────────────────────────────────────────────────────────────────

describe('fbtPayable', () => {
  it('computes annual FBT using the statutory formula: baseValue × 0.20 × 2.0802 × 0.47', () => {
    const baseValue = 50_000
    const expected = baseValue * FBT_STATUTORY_FRACTION * FBT_TYPE2_GROSS_UP * FBT_RATE
    expect(fbtPayable(baseValue)).toBeCloseTo(expected, 4)
  })

  it('returns 0 for a zero base value', () => {
    expect(fbtPayable(0)).toBe(0)
  })

  it('scales linearly with base value', () => {
    expect(fbtPayable(100_000)).toBeCloseTo(fbtPayable(50_000) * 2, 4)
  })

  it('gives a known value for a $65,000 vehicle', () => {
    // 65000 × 0.20 × 2.0802 × 0.47 = 65000 × 0.195538... = 12710.02 approx
    const expected = 65_000 * 0.20 * 2.0802 * 0.47
    expect(fbtPayable(65_000)).toBeCloseTo(expected, 2)
  })
})

// ── ecmAnnualContribution ─────────────────────────────────────────────────────

describe('ecmAnnualContribution', () => {
  it('equals base value × statutory fraction (20%)', () => {
    expect(ecmAnnualContribution(50_000)).toBeCloseTo(50_000 * FBT_STATUTORY_FRACTION, 4)
    expect(ecmAnnualContribution(50_000)).toBeCloseTo(10_000, 2)
  })

  it('returns 0 for a zero base value', () => {
    expect(ecmAnnualContribution(0)).toBe(0)
  })

  it('scales linearly with base value', () => {
    expect(ecmAnnualContribution(80_000)).toBeCloseTo(16_000, 2)
    expect(ecmAnnualContribution(100_000)).toBeCloseTo(20_000, 2)
  })

  it('is greater than fbtPayable for the same base value', () => {
    // ECM = baseValue × 0.20 (≈ 20%)
    // FBT = baseValue × 0.20 × 2.0802 × 0.47 (≈ 19.55%)
    // ECM > FBT, meaning the post-tax ECM fully eliminates the FBT liability
    expect(ecmAnnualContribution(60_000)).toBeGreaterThan(fbtPayable(60_000))
  })
})
