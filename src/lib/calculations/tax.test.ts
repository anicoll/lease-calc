import { describe, it, expect } from 'vitest'
import { incomeTax, medicareLevy, lito, totalTax, marginalRate } from './tax'
import {
  MEDICARE_LEVY_RATE,
  MEDICARE_LOW_INCOME_THRESHOLD,
  MEDICARE_SHADE_IN_THRESHOLD,
  LITO_MAX,
  LITO_PHASE_OUT_1_START,
  LITO_PHASE_OUT_1_END,
  LITO_PHASE_OUT_1_RATE,
  LITO_PHASE_OUT_2_START,
  LITO_PHASE_OUT_2_END,
  LITO_PHASE_OUT_2_RATE,
} from '../constants'

// ── incomeTax ─────────────────────────────────────────────────────────────────

describe('incomeTax', () => {
  it('returns 0 for zero income', () => {
    expect(incomeTax(0)).toBe(0)
  })

  it('returns 0 for negative income', () => {
    expect(incomeTax(-1_000)).toBe(0)
  })

  it('returns 0 for income at the tax-free threshold ($18,200)', () => {
    expect(incomeTax(18_200)).toBe(0)
  })

  it('applies 19% rate for income in the $18,201–$45,000 bracket', () => {
    // At $18,201: base=0, (18201 - 18201 + 1) * 0.19 = 0.19
    expect(incomeTax(18_201)).toBeCloseTo(0.19, 2)
    // At $30,000: (30000 - 18201 + 1) * 0.19 = 11800 * 0.19 = 2242
    expect(incomeTax(30_000)).toBeCloseTo(2_242, 0)
    // At $45,000: (45000 - 18201 + 1) * 0.19 = 26800 * 0.19 = 5092
    expect(incomeTax(45_000)).toBeCloseTo(5_092, 0)
  })

  it('applies 32.5% rate for income in the $45,001–$135,000 bracket', () => {
    // At $45,001: base=5092, (45001 - 45001 + 1) * 0.325 = 0.325
    expect(incomeTax(45_001)).toBeCloseTo(5_092.325, 2)
    // At $100,000: 5092 + (100000 - 45001 + 1) * 0.325 = 5092 + 55000 * 0.325 = 22967
    expect(incomeTax(100_000)).toBeCloseTo(22_967, 0)
    // At $135,000: 5092 + (135000 - 45001 + 1) * 0.325 = 5092 + 90000 * 0.325 = 34342
    expect(incomeTax(135_000)).toBeCloseTo(34_342, 0)
  })

  it('applies 37% rate for income in the $135,001–$190,000 bracket', () => {
    // At $150,000: 34342 + (150000 - 135001 + 1) * 0.37 = 34342 + 15000 * 0.37 = 39892
    expect(incomeTax(150_000)).toBeCloseTo(39_892, 0)
    // At $190,000: 34342 + (190000 - 135001 + 1) * 0.37 = 34342 + 55000 * 0.37 = 54692
    expect(incomeTax(190_000)).toBeCloseTo(54_692, 0)
  })

  it('applies 45% rate for income above $190,000', () => {
    // At $200,000: 55042 + (200000 - 190001 + 1) * 0.45 = 55042 + 10000 * 0.45 = 59542
    expect(incomeTax(200_000)).toBeCloseTo(59_542, 0)
    // At $300,000: 55042 + (300000 - 190001 + 1) * 0.45 = 55042 + 110000 * 0.45 = 104542
    expect(incomeTax(300_000)).toBeCloseTo(104_542, 0)
  })

  it('tax increases monotonically with income', () => {
    const incomes = [0, 18_200, 45_000, 100_000, 135_000, 190_000, 250_000]
    for (let i = 1; i < incomes.length; i++) {
      expect(incomeTax(incomes[i]!)).toBeGreaterThanOrEqual(incomeTax(incomes[i - 1]!))
    }
  })
})

// ── medicareLevy ──────────────────────────────────────────────────────────────

describe('medicareLevy', () => {
  it('returns 0 for income at or below the low-income threshold', () => {
    expect(medicareLevy(0)).toBe(0)
    expect(medicareLevy(MEDICARE_LOW_INCOME_THRESHOLD)).toBe(0)
  })

  it('applies shade-in rate (10% of excess) between thresholds', () => {
    // At $29,000: (29000 - 26000) * 0.1 = 300
    expect(medicareLevy(29_000)).toBeCloseTo(300, 2)
    // At shade-in threshold: (32500 - 26000) * 0.1 = 650
    expect(medicareLevy(MEDICARE_SHADE_IN_THRESHOLD)).toBeCloseTo(650, 2)
  })

  it('applies full 2% levy above the shade-in threshold', () => {
    expect(medicareLevy(50_000)).toBeCloseTo(1_000, 2)
    expect(medicareLevy(100_000)).toBeCloseTo(2_000, 2)
    expect(medicareLevy(200_000)).toBeCloseTo(4_000, 2)
  })

  it('levy at shade-in upper boundary equals full 2% amount at that income', () => {
    // Shade-in at $32,500: (32500 - 26000) * 0.1 = 650 = 32500 * 0.02 = 650
    const shadeIn = medicareLevy(MEDICARE_SHADE_IN_THRESHOLD)
    const full = MEDICARE_SHADE_IN_THRESHOLD * MEDICARE_LEVY_RATE
    expect(shadeIn).toBeCloseTo(full, 2)
  })

  it('levy just above shade-in threshold uses full 2% rate', () => {
    const above = MEDICARE_SHADE_IN_THRESHOLD + 1
    expect(medicareLevy(above)).toBeCloseTo(above * MEDICARE_LEVY_RATE, 2)
  })
})

// ── lito ──────────────────────────────────────────────────────────────────────

describe('lito', () => {
  it('returns the full LITO_MAX for income at or below phase-out 1 start', () => {
    expect(lito(0)).toBe(LITO_MAX)
    expect(lito(20_000)).toBe(LITO_MAX)
    expect(lito(LITO_PHASE_OUT_1_START)).toBe(LITO_MAX)
  })

  it('reduces offset in phase-out 1 ($37,500–$45,000)', () => {
    // At $40,000: 700 - (40000 - 37500) * 0.015 = 700 - 37.5 = 662.5
    expect(lito(40_000)).toBeCloseTo(662.5, 2)
    // At $45,000: 700 - (45000 - 37500) * 0.015 = 700 - 112.5 = 587.5
    const expectedAtEnd = LITO_MAX - (LITO_PHASE_OUT_1_END - LITO_PHASE_OUT_1_START) * LITO_PHASE_OUT_1_RATE
    expect(lito(LITO_PHASE_OUT_1_END)).toBeCloseTo(expectedAtEnd, 2)
  })

  it('continues reducing in phase-out 2 ($45,000–$66,667)', () => {
    const afterPhase1 = LITO_MAX - (LITO_PHASE_OUT_1_END - LITO_PHASE_OUT_1_START) * LITO_PHASE_OUT_1_RATE
    // At $50,000: afterPhase1 - (50000 - 45000) * 0.005
    const expected = afterPhase1 - (50_000 - LITO_PHASE_OUT_2_START) * LITO_PHASE_OUT_2_RATE
    expect(lito(50_000)).toBeCloseTo(expected, 2)
  })

  it('returns 0 for income above phase-out 2 end', () => {
    expect(lito(LITO_PHASE_OUT_2_END + 1)).toBe(0)
    expect(lito(100_000)).toBe(0)
    expect(lito(200_000)).toBe(0)
  })

  it('never returns a negative value', () => {
    // Math.max(0, ...) prevents negative values in phase-out 2
    expect(lito(60_000)).toBeGreaterThanOrEqual(0)
    expect(lito(66_666)).toBeGreaterThanOrEqual(0)
  })
})

// ── totalTax ──────────────────────────────────────────────────────────────────

describe('totalTax', () => {
  it('returns 0 for zero income', () => {
    expect(totalTax(0)).toBe(0)
  })

  it('is floored at 0 (never negative)', () => {
    // Very low income where LITO would exceed income tax
    expect(totalTax(10_000)).toBeGreaterThanOrEqual(0)
    expect(totalTax(1_000)).toBe(0)
  })

  it('equals incomeTax + medicareLevy - lito for a typical mid-range income', () => {
    const income = 80_000
    const expected = incomeTax(income) + medicareLevy(income) - lito(income)
    expect(totalTax(income)).toBeCloseTo(Math.max(0, expected), 2)
  })

  it('gives a known total tax for $100,000 income', () => {
    // incomeTax(100000) = 22967, medicareLevy = 2000, lito = 0
    expect(totalTax(100_000)).toBeCloseTo(24_967, 0)
  })

  it('increases with income across standard brackets', () => {
    const incomes = [30_000, 60_000, 100_000, 150_000, 200_000]
    for (let i = 1; i < incomes.length; i++) {
      expect(totalTax(incomes[i]!)).toBeGreaterThan(totalTax(incomes[i - 1]!))
    }
  })

  it('subtracts LITO from tax for lower incomes', () => {
    // At $30,000: incomeTax = 2242, medicare = 300 (shade-in), lito = 700
    // totalTax should be less than incomeTax + medicareLevy alone
    const income = 30_000
    expect(totalTax(income)).toBeLessThan(incomeTax(income) + medicareLevy(income))
  })
})

// ── marginalRate ──────────────────────────────────────────────────────────────

describe('marginalRate', () => {
  it('returns 0 + medicare (0.02) for income in the tax-free bracket', () => {
    expect(marginalRate(10_000)).toBeCloseTo(0.02, 4)
    expect(marginalRate(18_200)).toBeCloseTo(0.02, 4)
  })

  it('returns 0.19 + 0.02 = 0.21 for income in the 19% bracket', () => {
    expect(marginalRate(30_000)).toBeCloseTo(0.21, 4)
  })

  it('returns 0.325 + 0.02 = 0.345 for income in the 32.5% bracket', () => {
    expect(marginalRate(100_000)).toBeCloseTo(0.345, 4)
  })

  it('returns 0.37 + 0.02 = 0.39 for income in the 37% bracket', () => {
    expect(marginalRate(150_000)).toBeCloseTo(0.39, 4)
  })

  it('returns 0.45 + 0.02 = 0.47 for income above $190,000', () => {
    expect(marginalRate(200_000)).toBeCloseTo(0.47, 4)
    expect(marginalRate(500_000)).toBeCloseTo(0.47, 4)
  })
})
