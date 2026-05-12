import { describe, it, expect } from 'vitest'
import { getFbtExemptionStatus, getFbtPhase, getFbtPhaseWarning, fbtPayable, ecmAnnualContribution } from './fbt'
import {
  FBT_PARTIAL_TAXABLE_FRACTION,
  FBT_RATE,
  FBT_STATUTORY_FRACTION,
  FBT_TYPE2_GROSS_UP,
  LCT_THRESHOLD_FUEL_EFFICIENT,
} from '../constants'

// Convenience dates for each phase
const PHASE1_DATE = new Date('2026-06-01')  // Phase 1: before 1 Apr 2027
const PHASE2_DATE = new Date('2027-06-01')  // Phase 2: 1 Apr 2027 – 31 Mar 2029
const PHASE3_DATE = new Date('2029-06-01')  // Phase 3: from 1 Apr 2029

// ── getFbtPhase ───────────────────────────────────────────────────────────────

describe('getFbtPhase', () => {
  it('returns 1 for dates before FBT_PHASE2_START', () => {
    expect(getFbtPhase(PHASE1_DATE, false)).toBe(1)
  })

  it('returns 2 for dates on/after FBT_PHASE2_START but before FBT_PHASE3_START', () => {
    expect(getFbtPhase(PHASE2_DATE, false)).toBe(2)
    expect(getFbtPhase(new Date('2027-04-01'), false)).toBe(2)
  })

  it('returns 3 for dates on/after FBT_PHASE3_START', () => {
    expect(getFbtPhase(PHASE3_DATE, false)).toBe(3)
    expect(getFbtPhase(new Date('2029-04-01'), false)).toBe(3)
  })

  it('always returns 1 for grandfathered leases regardless of date', () => {
    expect(getFbtPhase(PHASE2_DATE, true)).toBe(1)
    expect(getFbtPhase(PHASE3_DATE, true)).toBe(1)
    expect(getFbtPhase(new Date('2030-01-01'), true)).toBe(1)
  })

  it('returns 1 for dates before the grandfathering cutoff (pre-April 2027)', () => {
    expect(getFbtPhase(new Date('2026-04-01'), false)).toBe(1)
    expect(getFbtPhase(new Date('2027-03-31'), false)).toBe(1)
  })
})

// ── getFbtExemptionStatus — BEV ───────────────────────────────────────────────

describe('getFbtExemptionStatus — BEV', () => {
  describe('Phase 1 (before 1 Apr 2027)', () => {
    it('is fully exempt when cost is below the fuel-efficient LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', 60_000, PHASE1_DATE, false, false)).toBe('full')
    })

    it('is fully exempt at exactly the fuel-efficient LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT, PHASE1_DATE, false, false)).toBe('full')
    })

    it('is NOT exempt when cost exceeds the fuel-efficient LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, PHASE1_DATE, false, false)).toBe('none')
      expect(getFbtExemptionStatus('BEV', 95_000, PHASE1_DATE, false, false)).toBe('none')
    })
  })

  describe('Phase 2 (1 Apr 2027 – 31 Mar 2029)', () => {
    it('is fully exempt when cost is at or below $75,000', () => {
      expect(getFbtExemptionStatus('BEV', 75_000, PHASE2_DATE, false, false)).toBe('full')
      expect(getFbtExemptionStatus('BEV', 60_000, PHASE2_DATE, false, false)).toBe('full')
    })

    it('is partially exempt when cost is above $75,000 but under LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', 80_000, PHASE2_DATE, false, false)).toBe('partial')
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT, PHASE2_DATE, false, false)).toBe('partial')
    })

    it('is NOT exempt when cost exceeds the LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, PHASE2_DATE, false, false)).toBe('none')
    })
  })

  describe('Phase 3 (from 1 Apr 2029)', () => {
    it('is partially exempt when cost is under the LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', 60_000, PHASE3_DATE, false, false)).toBe('partial')
      expect(getFbtExemptionStatus('BEV', 75_000, PHASE3_DATE, false, false)).toBe('partial')
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT, PHASE3_DATE, false, false)).toBe('partial')
    })

    it('is NOT exempt when cost exceeds the LCT threshold', () => {
      expect(getFbtExemptionStatus('BEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, PHASE3_DATE, false, false)).toBe('none')
    })
  })

  describe('grandfathered lease', () => {
    it('is always fully exempt when grandfathered, regardless of date or Phase 2/3', () => {
      expect(getFbtExemptionStatus('BEV', 80_000, PHASE2_DATE, false, true)).toBe('full')
      expect(getFbtExemptionStatus('BEV', 60_000, PHASE3_DATE, false, true)).toBe('full')
    })
  })
})

// ── getFbtExemptionStatus — PHEV ──────────────────────────────────────────────

describe('getFbtExemptionStatus — PHEV', () => {
  it('is fully exempt when delivered before Apr 2025 AND cost is under threshold', () => {
    expect(getFbtExemptionStatus('PHEV', 60_000, PHASE1_DATE, true, false)).toBe('full')
  })

  it('is NOT exempt when delivered after Apr 2025 regardless of cost', () => {
    expect(getFbtExemptionStatus('PHEV', 60_000, PHASE1_DATE, false, false)).toBe('none')
    expect(getFbtExemptionStatus('PHEV', 30_000, PHASE1_DATE, false, false)).toBe('none')
  })

  it('is NOT exempt when cost exceeds threshold even if delivered before Apr 2025', () => {
    expect(getFbtExemptionStatus('PHEV', LCT_THRESHOLD_FUEL_EFFICIENT + 1, PHASE1_DATE, true, false)).toBe('none')
  })

  it('is NOT affected by Phase 2/3 date rules (PHEV eligibility is controlled only by delivery date)', () => {
    expect(getFbtExemptionStatus('PHEV', 60_000, PHASE2_DATE, true, false)).toBe('full')
    expect(getFbtExemptionStatus('PHEV', 60_000, PHASE3_DATE, true, false)).toBe('full')
  })
})

// ── getFbtExemptionStatus — ICE ───────────────────────────────────────────────

describe('getFbtExemptionStatus — ICE', () => {
  it('is never exempt regardless of cost, date, or phase', () => {
    expect(getFbtExemptionStatus('ICE', 30_000, PHASE1_DATE, false, false)).toBe('none')
    expect(getFbtExemptionStatus('ICE', 60_000, PHASE2_DATE, false, false)).toBe('none')
    expect(getFbtExemptionStatus('ICE', 120_000, PHASE3_DATE, false, false)).toBe('none')
  })
})

// ── getFbtPhaseWarning ────────────────────────────────────────────────────────

describe('getFbtPhaseWarning', () => {
  it('returns null for a grandfathered lease', () => {
    expect(getFbtPhaseWarning(PHASE1_DATE, 5, true)).toBeNull()
  })

  it('returns null for a Phase 1 lease (all pre-April 2027 leases are grandfathered)', () => {
    // Any lease starting before 1 Apr 2027 is grandfathered — no warning needed
    expect(getFbtPhaseWarning(PHASE1_DATE, 5, false)).toBeNull()
    expect(getFbtPhaseWarning(new Date('2027-03-31'), 5, false)).toBeNull()
  })

  it('warns when a Phase 2 lease extends into Phase 3', () => {
    // 3-year lease starting June 2027 ends June 2030 — crosses Phase 3 (Apr 2029)
    const warning = getFbtPhaseWarning(PHASE2_DATE, 3, false)
    expect(warning).not.toBeNull()
    expect(warning).toContain('1 Apr 2029')
  })

  it('warns when a Phase 2 lease extends into Phase 3', () => {
    // 3-year lease starting June 2027 ends June 2030 — crosses Phase 3 (Apr 2029)
    const warning = getFbtPhaseWarning(PHASE2_DATE, 3, false)
    expect(warning).not.toBeNull()
    expect(warning).toContain('Phase 3')
  })

  it('returns null when a Phase 2 lease stays within Phase 2', () => {
    // 1-year lease starting June 2027 ends June 2028 — within Phase 2
    const warning = getFbtPhaseWarning(PHASE2_DATE, 1, false)
    expect(warning).toBeNull()
  })

  it('returns null for Phase 3 leases (no future phase changes)', () => {
    const warning = getFbtPhaseWarning(PHASE3_DATE, 5, false)
    expect(warning).toBeNull()
  })
})

// ── fbtPayable ────────────────────────────────────────────────────────────────

describe('fbtPayable', () => {
  it('returns 0 for fully exempt vehicles', () => {
    expect(fbtPayable(60_000, 'full')).toBe(0)
    expect(fbtPayable(0, 'full')).toBe(0)
  })

  it('computes full annual FBT for non-exempt vehicles: baseValue × 0.20 × 2.0802 × 0.47', () => {
    const baseValue = 50_000
    const expected = baseValue * FBT_STATUTORY_FRACTION * FBT_TYPE2_GROSS_UP * FBT_RATE
    expect(fbtPayable(baseValue, 'none')).toBeCloseTo(expected, 4)
  })

  it('computes 75% of full FBT for partially exempt vehicles', () => {
    const baseValue = 80_000
    const fullFbt = baseValue * FBT_STATUTORY_FRACTION * FBT_TYPE2_GROSS_UP * FBT_RATE
    expect(fbtPayable(baseValue, 'partial')).toBeCloseTo(fullFbt * FBT_PARTIAL_TAXABLE_FRACTION, 4)
  })

  it('partial FBT is less than full FBT for same base value', () => {
    expect(fbtPayable(80_000, 'partial')).toBeLessThan(fbtPayable(80_000, 'none'))
  })

  it('scales linearly with base value for non-exempt status', () => {
    expect(fbtPayable(100_000, 'none')).toBeCloseTo(fbtPayable(50_000, 'none') * 2, 4)
  })

  it('returns 0 for a zero base value', () => {
    expect(fbtPayable(0, 'none')).toBe(0)
    expect(fbtPayable(0, 'partial')).toBe(0)
  })
})

// ── ecmAnnualContribution ─────────────────────────────────────────────────────

describe('ecmAnnualContribution', () => {
  it('equals base value × 20% for non-exempt vehicles', () => {
    expect(ecmAnnualContribution(50_000, 'none')).toBeCloseTo(50_000 * FBT_STATUTORY_FRACTION, 4)
    expect(ecmAnnualContribution(50_000, 'none')).toBeCloseTo(10_000, 2)
  })

  it('equals base value × 20% × 75% for partially exempt vehicles', () => {
    const baseValue = 80_000
    const expected = baseValue * FBT_STATUTORY_FRACTION * FBT_PARTIAL_TAXABLE_FRACTION
    expect(ecmAnnualContribution(baseValue, 'partial')).toBeCloseTo(expected, 4)
  })

  it('partial ECM is 75% of the full ECM', () => {
    const baseValue = 80_000
    expect(ecmAnnualContribution(baseValue, 'partial')).toBeCloseTo(
      ecmAnnualContribution(baseValue, 'none') * FBT_PARTIAL_TAXABLE_FRACTION, 4,
    )
  })

  it('returns 0 for a zero base value', () => {
    expect(ecmAnnualContribution(0, 'none')).toBe(0)
    expect(ecmAnnualContribution(0, 'partial')).toBe(0)
  })

  it('full ECM is greater than full FBT (ECM fully eliminates the FBT liability)', () => {
    // ECM = baseValue × 0.20 ≈ 20%
    // FBT = baseValue × 0.20 × 2.0802 × 0.47 ≈ 19.55%
    expect(ecmAnnualContribution(60_000, 'none')).toBeGreaterThan(fbtPayable(60_000, 'none'))
  })
})
