import { pmt } from './lease'
import { isFbtExempt } from './fbt'
import {
  FBT_RATE,
  FBT_STATUTORY_FRACTION,
  FBT_TYPE2_GROSS_UP,
} from '../constants'
import type { EarlyTerminationInputs, EarlyTerminationResult } from '../../types'

/**
 * Present value of remaining lease payments plus residual.
 * This is what the finance company demands to exit the lease early.
 */
function financePayout(
  monthlyPayment: number,
  monthlyRate: number,
  monthsRemaining: number,
  residual: number,
): number {
  if (monthlyRate === 0) return monthlyPayment * monthsRemaining + residual
  const factor = Math.pow(1 + monthlyRate, -monthsRemaining)
  return monthlyPayment * (1 - factor) / monthlyRate + residual * factor
}

/**
 * Number of days the vehicle was used within the FBT year that contains
 * the termination date. The FBT year runs April 1 – March 31.
 *
 * Counts from the later of (FBT year start, lease start) to the termination date.
 */
export function daysInFbtYear(terminationDate: Date, monthsElapsed: number): number {
  const year = terminationDate.getFullYear()
  const month = terminationDate.getMonth() // 0-indexed

  // FBT year start: April 1 of prior calendar year if we are in Jan–Mar,
  // otherwise April 1 of the current calendar year.
  const fbtYearStart = month < 3
    ? new Date(year - 1, 3, 1)
    : new Date(year, 3, 1)

  // Approximate lease start by subtracting elapsed months.
  const leaseStart = new Date(terminationDate)
  leaseStart.setMonth(leaseStart.getMonth() - monthsElapsed)

  // Effective period start is the later of FBT year start and lease start.
  const periodStart = leaseStart > fbtYearStart ? leaseStart : fbtYearStart

  const msPerDay = 1000 * 60 * 60 * 24
  return Math.max(0, Math.round((terminationDate.getTime() - periodStart.getTime()) / msPerDay))
}

/**
 * Prorated FBT for a partial FBT year using the statutory formula method.
 * Annual FBT = baseValue × 0.20 × 2.0802 × 0.47
 * Prorated FBT = annual FBT × (daysUsed / 365)
 */
function partialYearFbt(baseValue: number, days: number): number {
  const annualFbt = baseValue * FBT_STATUTORY_FRACTION * FBT_TYPE2_GROSS_UP * FBT_RATE
  return annualFbt * (days / 365)
}

export function calculateEarlyTermination(
  inputs: EarlyTerminationInputs,
): EarlyTerminationResult {
  const {
    vehicleBaseValue,
    annualInterestRate,
    originalTermMonths,
    monthsElapsed,
    residualValue,
    monthlyLeasePayment,
    monthlyManagementFee,
    terminationFee,
    currentMarketValue,
    vehicleType,
    phevDeliveredBeforeApril2025,
    terminationDate,
  } = inputs

  const monthsRemaining = Math.max(0, originalTermMonths - monthsElapsed)
  const monthlyRate = annualInterestRate / 12

  // Use supplied payment or derive via pmt()
  const derivedMonthlyPayment =
    monthlyLeasePayment !== null && monthlyLeasePayment > 0
      ? monthlyLeasePayment
      : pmt(monthlyRate, originalTermMonths, vehicleBaseValue, residualValue)

  const payout = financePayout(derivedMonthlyPayment, monthlyRate, monthsRemaining, residualValue)
  const remainingManagementFees = monthlyManagementFee * monthsRemaining

  // Vehicle equity (only if market value was provided)
  let vehicleEquity: number | null = null
  let isUnderwater: boolean | null = null
  if (currentMarketValue !== null) {
    vehicleEquity = currentMarketValue - payout
    isUnderwater = vehicleEquity < 0
  }

  // FBT exposure
  const exempt = isFbtExempt(vehicleType, vehicleBaseValue, phevDeliveredBeforeApril2025)
  const days = daysInFbtYear(terminationDate, monthsElapsed)
  const fbtAmount = exempt ? 0 : partialYearFbt(vehicleBaseValue, days)

  // Total exposure: payout + management fees + termination fee + FBT - positive equity offset
  let totalFinancialExposure: number | null = null
  if (vehicleEquity !== null) {
    const equityOffset = Math.max(0, vehicleEquity)
    totalFinancialExposure = payout + remainingManagementFees + terminationFee + fbtAmount - equityOffset
  }

  return {
    monthsRemaining,
    derivedMonthlyPayment,
    financePayout: payout,
    remainingManagementFees,
    terminationFee,
    vehicleEquity,
    isUnderwater,
    fbtExempt: exempt,
    partialYearFbtPayable: fbtAmount,
    daysUsedInFbtYear: days,
    ecmAccountNote:
      'Any unspent balance in your ECM / running costs account should be refunded by your novated lease provider. Contact them directly to arrange this — the amount will vary based on your account activity.',
    totalFinancialExposure,
  }
}
