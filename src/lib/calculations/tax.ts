import {
  LITO_MAX,
  LITO_PHASE_OUT_1_END,
  LITO_PHASE_OUT_1_RATE,
  LITO_PHASE_OUT_1_START,
  LITO_PHASE_OUT_2_END,
  LITO_PHASE_OUT_2_RATE,
  LITO_PHASE_OUT_2_START,
  MEDICARE_LEVY_RATE,
  MEDICARE_LOW_INCOME_THRESHOLD,
  MEDICARE_SHADE_IN_THRESHOLD,
  TAX_BRACKETS,
} from '../constants'

export function incomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.max) {
      return bracket.base + (taxableIncome - bracket.min + 1) * bracket.rate
    }
  }
  return 0
}

export function medicareLevy(taxableIncome: number): number {
  if (taxableIncome <= MEDICARE_LOW_INCOME_THRESHOLD) return 0
  if (taxableIncome <= MEDICARE_SHADE_IN_THRESHOLD) {
    // Shade-in: levy = 10% of (income - low threshold)
    return (taxableIncome - MEDICARE_LOW_INCOME_THRESHOLD) * 0.1
  }
  return taxableIncome * MEDICARE_LEVY_RATE
}

export function lito(taxableIncome: number): number {
  if (taxableIncome <= LITO_PHASE_OUT_1_START) return LITO_MAX
  if (taxableIncome <= LITO_PHASE_OUT_1_END) {
    return LITO_MAX - (taxableIncome - LITO_PHASE_OUT_1_START) * LITO_PHASE_OUT_1_RATE
  }
  if (taxableIncome <= LITO_PHASE_OUT_2_END) {
    const afterPhase1 = LITO_MAX - (LITO_PHASE_OUT_1_END - LITO_PHASE_OUT_1_START) * LITO_PHASE_OUT_1_RATE
    return Math.max(0, afterPhase1 - (taxableIncome - LITO_PHASE_OUT_2_START) * LITO_PHASE_OUT_2_RATE)
  }
  return 0
}

/** Total tax payable (income tax + Medicare levy - LITO), floored at 0 */
export function totalTax(taxableIncome: number): number {
  const tax = incomeTax(taxableIncome) + medicareLevy(taxableIncome) - lito(taxableIncome)
  return Math.max(0, tax)
}

/** Marginal tax rate at a given income (including Medicare levy) */
export function marginalRate(taxableIncome: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.max) {
      return bracket.rate + MEDICARE_LEVY_RATE
    }
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1]!.rate + MEDICARE_LEVY_RATE
}
