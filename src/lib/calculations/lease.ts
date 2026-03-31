import { ATO_RESIDUALS, LCT_RATE, LCT_THRESHOLD_FUEL_EFFICIENT, LCT_THRESHOLD_GENERAL } from '../constants'
import type { VehicleType } from '../../types'

/**
 * Standard financial PMT (payment) formula.
 * Returns the periodic payment amount (positive = money out).
 *
 * @param r  Periodic interest rate (annual rate / 12)
 * @param n  Number of periods (months)
 * @param pv Present value (vehicle cost, positive)
 * @param fv Future value (residual, positive — recovered at end)
 */
export function pmt(r: number, n: number, pv: number, fv: number): number {
  if (r === 0) return (pv - fv) / n
  const factor = Math.pow(1 + r, n)
  return (pv * r * factor - fv * r) / (factor - 1)
}

/** ATO minimum residual % for a given lease term (1–5 years) */
export function atoResidualPercent(termYears: number): number {
  return ATO_RESIDUALS[termYears] ?? ATO_RESIDUALS[5]!
}

/** Residual value in dollars */
export function residualValue(vehicleCost: number, residualPercent: number): number {
  return vehicleCost * residualPercent
}

/**
 * Luxury Car Tax amount (federal).
 * Calculated on the GST-exclusive amount above the relevant threshold.
 * Returns 0 if vehicle is below threshold.
 */
export function lct(vehicleCost: number, vehicleType: VehicleType): number {
  const threshold =
    vehicleType === 'BEV' || vehicleType === 'PHEV'
      ? LCT_THRESHOLD_FUEL_EFFICIENT
      : LCT_THRESHOLD_GENERAL
  if (vehicleCost <= threshold) return 0
  // LCT = (cost - threshold) / 1.1 * LCT_RATE
  // The price includes GST; LCT is on the GST-exclusive excess.
  return ((vehicleCost - threshold) / 1.1) * LCT_RATE
}

/**
 * Solve for the implied annual interest rate given a known monthly payment.
 * Uses Newton-Raphson iteration.
 * Returns null if convergence fails.
 */
export function impliedAnnualRate(
  monthlyPayment: number,
  vehicleCost: number,
  residual: number,
  termMonths: number,
): number | null {
  let r = 0.07 / 12  // initial guess: 7% pa / 12

  for (let i = 0; i < 200; i++) {
    const f = pmt(r, termMonths, vehicleCost, residual) - monthlyPayment
    const dr = 1e-8
    const df = (pmt(r + dr, termMonths, vehicleCost, residual) - pmt(r - dr, termMonths, vehicleCost, residual)) / (2 * dr)
    if (Math.abs(df) < 1e-10) return null
    const rNext = r - f / df
    if (Math.abs(rNext - r) < 1e-10) return rNext * 12
    r = rNext
    if (r < 0 || r > 1) return null
  }
  return null
}
