import {
  FBT_RATE,
  FBT_STATUTORY_FRACTION,
  FBT_TYPE2_GROSS_UP,
  LCT_THRESHOLD_FUEL_EFFICIENT,
} from '../constants'
import type { VehicleType } from '../../types'

export function isFbtExempt(
  vehicleType: VehicleType,
  vehicleCost: number,
  phevDeliveredBeforeApril2025: boolean,
): boolean {
  if (vehicleType === 'BEV') {
    return vehicleCost <= LCT_THRESHOLD_FUEL_EFFICIENT
  }
  if (vehicleType === 'PHEV') {
    return phevDeliveredBeforeApril2025 && vehicleCost <= LCT_THRESHOLD_FUEL_EFFICIENT
  }
  return false
}

/** Annual FBT payable using statutory formula method (before ECM) */
export function fbtPayable(baseValue: number): number {
  const taxableValue = baseValue * FBT_STATUTORY_FRACTION
  return taxableValue * FBT_TYPE2_GROSS_UP * FBT_RATE
}

/**
 * Annual post-tax ECM contribution required to reduce FBT to $0.
 * The contribution equals the taxable value (base value × statutory fraction).
 */
export function ecmAnnualContribution(baseValue: number): number {
  return baseValue * FBT_STATUTORY_FRACTION
}
