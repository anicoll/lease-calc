import { describe, it, expect } from 'vitest'
import { calculateStampDuty } from './constants'

// ── NSW ───────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — NSW', () => {
  it('applies $3/$100 up to $45,000', () => {
    expect(calculateStampDuty(30_000, 'ICE', 'NSW')).toBeCloseTo(900, 2)
    expect(calculateStampDuty(45_000, 'ICE', 'NSW')).toBeCloseTo(1_350, 2)
  })

  it('applies $1,350 + $5/$100 above $45,000', () => {
    // $50,000: 1350 + (50000 - 45000) * 0.05 = 1350 + 250 = 1600
    expect(calculateStampDuty(50_000, 'ICE', 'NSW')).toBeCloseTo(1_600, 2)
    // $100,000: 1350 + (100000 - 45000) * 0.05 = 1350 + 2750 = 4100
    expect(calculateStampDuty(100_000, 'ICE', 'NSW')).toBeCloseTo(4_100, 2)
  })

  it('has no EV concession — BEV and ICE pay the same', () => {
    expect(calculateStampDuty(60_000, 'BEV', 'NSW')).toBeCloseTo(
      calculateStampDuty(60_000, 'ICE', 'NSW'),
      2,
    )
    expect(calculateStampDuty(60_000, 'PHEV', 'NSW')).toBeCloseTo(
      calculateStampDuty(60_000, 'ICE', 'NSW'),
      2,
    )
  })
})

// ── VIC ───────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — VIC', () => {
  it('applies 4.2% for BEV', () => {
    expect(calculateStampDuty(50_000, 'BEV', 'VIC')).toBeCloseTo(2_100, 2)
    expect(calculateStampDuty(80_000, 'BEV', 'VIC')).toBeCloseTo(3_360, 2)
  })

  it('applies 4.2% for PHEV', () => {
    expect(calculateStampDuty(50_000, 'PHEV', 'VIC')).toBeCloseTo(2_100, 2)
  })

  it('applies 5.5% for ICE', () => {
    expect(calculateStampDuty(50_000, 'ICE', 'VIC')).toBeCloseTo(2_750, 2)
    expect(calculateStampDuty(80_000, 'ICE', 'VIC')).toBeCloseTo(4_400, 2)
  })

  it('BEV/PHEV pays less than ICE', () => {
    expect(calculateStampDuty(60_000, 'BEV', 'VIC')).toBeLessThan(
      calculateStampDuty(60_000, 'ICE', 'VIC'),
    )
  })
})

// ── QLD ───────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — QLD', () => {
  it('applies 2% for BEV at any price', () => {
    expect(calculateStampDuty(50_000, 'BEV', 'QLD')).toBeCloseTo(1_000, 2)
    expect(calculateStampDuty(120_000, 'BEV', 'QLD')).toBeCloseTo(2_400, 2)
  })

  it('applies 2% for PHEV at any price', () => {
    expect(calculateStampDuty(50_000, 'PHEV', 'QLD')).toBeCloseTo(1_000, 2)
  })

  it('applies 3% for ICE up to $100,000', () => {
    expect(calculateStampDuty(80_000, 'ICE', 'QLD')).toBeCloseTo(2_400, 2)
    expect(calculateStampDuty(100_000, 'ICE', 'QLD')).toBeCloseTo(3_000, 2)
  })

  it('applies $3,000 + 5% of excess above $100,000 for ICE', () => {
    // $150,000: 3000 + (150000 - 100000) * 0.05 = 3000 + 2500 = 5500
    expect(calculateStampDuty(150_000, 'ICE', 'QLD')).toBeCloseTo(5_500, 2)
  })

  it('BEV pays less than ICE at all price points', () => {
    expect(calculateStampDuty(80_000, 'BEV', 'QLD')).toBeLessThan(
      calculateStampDuty(80_000, 'ICE', 'QLD'),
    )
  })
})

// ── SA ────────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — SA', () => {
  it('returns minimum $5 for very low prices (under $1,000)', () => {
    expect(calculateStampDuty(500, 'ICE', 'SA')).toBe(5)
    expect(calculateStampDuty(999, 'ICE', 'SA')).toBe(5)
  })

  it('applies $10 + $2/$100 over $1,000 for prices $1,000–$1,999', () => {
    // $1,500: 10 + (1500 - 1000) * 0.02 = 10 + 10 = 20
    expect(calculateStampDuty(1_500, 'ICE', 'SA')).toBeCloseTo(20, 2)
  })

  it('applies $30 + $3/$100 over $2,000 for prices $2,000–$2,999', () => {
    // $2,500: 30 + (2500 - 2000) * 0.03 = 30 + 15 = 45
    expect(calculateStampDuty(2_500, 'ICE', 'SA')).toBeCloseTo(45, 2)
  })

  it('applies $60 + $4/$100 over $3,000 for prices above $3,000', () => {
    // $50,000: 60 + (50000 - 3000) * 0.04 = 60 + 1880 = 1940
    expect(calculateStampDuty(50_000, 'ICE', 'SA')).toBeCloseTo(1_940, 2)
    // $3,000: 60 + 0 = 60
    expect(calculateStampDuty(3_000, 'ICE', 'SA')).toBeCloseTo(60, 2)
  })

  it('has no EV concession — BEV pays same as ICE', () => {
    expect(calculateStampDuty(50_000, 'BEV', 'SA')).toBeCloseTo(
      calculateStampDuty(50_000, 'ICE', 'SA'),
      2,
    )
  })
})

// ── WA ────────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — WA', () => {
  it('applies 2.75% for prices at or below $25,000', () => {
    expect(calculateStampDuty(20_000, 'ICE', 'WA')).toBeCloseTo(550, 2)
    expect(calculateStampDuty(25_000, 'ICE', 'WA')).toBeCloseTo(687.5, 2)
  })

  it('applies $687.50 + 4% of excess over $25,000 up to $50,000', () => {
    // $30,000: 687.5 + (30000 - 25000) * 0.04 = 687.5 + 200 = 887.5
    expect(calculateStampDuty(30_000, 'ICE', 'WA')).toBeCloseTo(887.5, 2)
    // $50,000: 687.5 + (50000 - 25000) * 0.04 = 687.5 + 1000 = 1687.5
    expect(calculateStampDuty(50_000, 'ICE', 'WA')).toBeCloseTo(1_687.5, 2)
  })

  it('applies 6.5% for prices above $50,000', () => {
    // $60,000: 60000 * 0.065 = 3900
    expect(calculateStampDuty(60_000, 'ICE', 'WA')).toBeCloseTo(3_900, 2)
    expect(calculateStampDuty(100_000, 'ICE', 'WA')).toBeCloseTo(6_500, 2)
  })

  it('has no EV concession — BEV pays same as ICE', () => {
    expect(calculateStampDuty(60_000, 'BEV', 'WA')).toBeCloseTo(
      calculateStampDuty(60_000, 'ICE', 'WA'),
      2,
    )
  })
})

// ── TAS ───────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — TAS', () => {
  it('returns $20 flat for prices at or below $600', () => {
    expect(calculateStampDuty(300, 'ICE', 'TAS')).toBe(20)
    expect(calculateStampDuty(600, 'ICE', 'TAS')).toBe(20)
  })

  it('applies 3% for prices between $601 and $34,999', () => {
    expect(calculateStampDuty(1_000, 'ICE', 'TAS')).toBeCloseTo(30, 2)
    expect(calculateStampDuty(20_000, 'ICE', 'TAS')).toBeCloseTo(600, 2)
  })

  it('applies $1,050 + 11% of excess over $35,000 for prices $35,000–$39,999', () => {
    // $35,000: 1050 + 0 = 1050
    expect(calculateStampDuty(35_000, 'ICE', 'TAS')).toBeCloseTo(1_050, 2)
    // $37,000: 1050 + (37000 - 35000) * 0.11 = 1050 + 220 = 1270
    expect(calculateStampDuty(37_000, 'ICE', 'TAS')).toBeCloseTo(1_270, 2)
  })

  it('applies 4% for prices at or above $40,000', () => {
    expect(calculateStampDuty(40_000, 'ICE', 'TAS')).toBeCloseTo(1_600, 2)
    expect(calculateStampDuty(60_000, 'ICE', 'TAS')).toBeCloseTo(2_400, 2)
  })

  it('has no EV concession — BEV pays same as ICE', () => {
    expect(calculateStampDuty(50_000, 'BEV', 'TAS')).toBeCloseTo(
      calculateStampDuty(50_000, 'ICE', 'TAS'),
      2,
    )
  })
})

// ── ACT ───────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — ACT', () => {
  it('BEV is fully exempt (returns 0)', () => {
    expect(calculateStampDuty(30_000, 'BEV', 'ACT')).toBe(0)
    expect(calculateStampDuty(100_000, 'BEV', 'ACT')).toBe(0)
  })

  it('PHEV pays 2%', () => {
    expect(calculateStampDuty(50_000, 'PHEV', 'ACT')).toBeCloseTo(1_000, 2)
    expect(calculateStampDuty(80_000, 'PHEV', 'ACT')).toBeCloseTo(1_600, 2)
  })

  it('ICE pays 3%', () => {
    expect(calculateStampDuty(50_000, 'ICE', 'ACT')).toBeCloseTo(1_500, 2)
    expect(calculateStampDuty(80_000, 'ICE', 'ACT')).toBeCloseTo(2_400, 2)
  })

  it('BEV < PHEV < ICE duty order', () => {
    const price = 60_000
    expect(calculateStampDuty(price, 'BEV', 'ACT')).toBeLessThan(
      calculateStampDuty(price, 'PHEV', 'ACT'),
    )
    expect(calculateStampDuty(price, 'PHEV', 'ACT')).toBeLessThan(
      calculateStampDuty(price, 'ICE', 'ACT'),
    )
  })
})

// ── NT ────────────────────────────────────────────────────────────────────────

describe('calculateStampDuty — NT', () => {
  it('applies 3% + $18 transfer fee for ICE', () => {
    // $50,000: 50000 * 0.03 + 18 = 1518
    expect(calculateStampDuty(50_000, 'ICE', 'NT')).toBeCloseTo(1_518, 2)
    expect(calculateStampDuty(30_000, 'ICE', 'NT')).toBeCloseTo(918, 2)
  })

  it('BEV under $50,000 receives up to $1,500 concession', () => {
    // $40,000 BEV: duty = 40000*0.03 + 18 = 1218; concession: max(0, 1218 - 1500) = 0
    expect(calculateStampDuty(40_000, 'BEV', 'NT')).toBeCloseTo(0, 2)
    // $50,000 BEV: duty = 50000*0.03 + 18 = 1518; concession: max(0, 1518 - 1500) = 18
    expect(calculateStampDuty(50_000, 'BEV', 'NT')).toBeCloseTo(18, 2)
  })

  it('BEV over $50,000 does not receive the concession', () => {
    // $60,000 BEV: duty = 60000*0.03 + 18 = 1818 (no concession)
    expect(calculateStampDuty(60_000, 'BEV', 'NT')).toBeCloseTo(1_818, 2)
  })

  it('PHEV does not receive the BEV concession', () => {
    expect(calculateStampDuty(40_000, 'PHEV', 'NT')).toBeCloseTo(
      calculateStampDuty(40_000, 'ICE', 'NT'),
      2,
    )
  })

  it('duty is never negative (clamped at 0 when concession exceeds duty)', () => {
    // Small price BEV — concession would exceed duty
    expect(calculateStampDuty(10_000, 'BEV', 'NT')).toBeGreaterThanOrEqual(0)
  })
})
