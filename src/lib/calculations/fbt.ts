import {
  FBT_GRANDFATHERING_CUTOFF,
  FBT_PARTIAL_TAXABLE_FRACTION,
  FBT_PHASE2_FULL_EXEMPTION_CAP,
  FBT_PHASE2_START,
  FBT_PHASE3_START,
  FBT_RATE,
  FBT_STATUTORY_FRACTION,
  FBT_TYPE2_GROSS_UP,
  LCT_THRESHOLD_FUEL_EFFICIENT,
} from '../constants'
import type { FbtExemptionStatus, VehicleType } from '../../types'

/** Returns the FBT phase (1, 2, or 3) that governs a lease based on its start date. */
export function getFbtPhase(leaseStartDate: Date, grandfathered: boolean): 1 | 2 | 3 {
  if (grandfathered || leaseStartDate < FBT_GRANDFATHERING_CUTOFF) return 1
  if (leaseStartDate < FBT_PHASE2_START) return 1
  if (leaseStartDate < FBT_PHASE3_START) return 2
  return 3
}

export function getFbtExemptionStatus(
  vehicleType: VehicleType,
  vehicleCost: number,
  leaseStartDate: Date,
  phevDeliveredBeforeApril2025: boolean,
  grandfathered: boolean,
): FbtExemptionStatus {
  if (vehicleType === 'PHEV') {
    return phevDeliveredBeforeApril2025 && vehicleCost <= LCT_THRESHOLD_FUEL_EFFICIENT ? 'full' : 'none'
  }
  if (vehicleType === 'ICE') return 'none'

  // BEV: check LCT cap first, then apply phase rules
  if (vehicleCost > LCT_THRESHOLD_FUEL_EFFICIENT) return 'none'
  const phase = getFbtPhase(leaseStartDate, grandfathered)
  if (phase === 1) return 'full'
  if (phase === 2) return vehicleCost <= FBT_PHASE2_FULL_EXEMPTION_CAP ? 'full' : 'partial'
  return 'partial' // phase 3: all BEVs under LCT threshold get partial only
}

/**
 * Returns a warning when a lease will cross an FBT phase boundary mid-term.
 * Grandfathered leases are unaffected.
 */
export function getFbtPhaseWarning(
  leaseStartDate: Date,
  termYears: number,
  grandfathered: boolean,
): string | null {
  if (grandfathered || leaseStartDate < FBT_GRANDFATHERING_CUTOFF) return null
  const leaseEndDate = new Date(leaseStartDate)
  leaseEndDate.setFullYear(leaseEndDate.getFullYear() + termYears)
  const phase = getFbtPhase(leaseStartDate, grandfathered)
  if (phase === 1 && leaseEndDate >= FBT_PHASE3_START) {
    return 'This lease spans Phase 1, 2, and 3. From 1 Apr 2027, BEVs over $75,000 entering new leases will incur partial FBT; from 1 Apr 2029, all BEVs will. These rules apply to new leases signed after those dates, not this one.'
  }
  if (phase === 1 && leaseEndDate >= FBT_PHASE2_START) {
    return 'This lease will run into Phase 2 (from 1 Apr 2027). New BEV leases signed after that date for vehicles priced above $75,000 will only receive 25% FBT exemption.'
  }
  if (phase === 2 && leaseEndDate >= FBT_PHASE3_START) {
    return 'This lease will run into Phase 3 (from 1 Apr 2029), where all new BEV leases will receive only 25% FBT exemption regardless of price.'
  }
  return null
}

/** Annual FBT payable using the statutory formula, accounting for exemption status. */
export function fbtPayable(baseValue: number, status: FbtExemptionStatus): number {
  if (status === 'full') return 0
  const exposedFraction = status === 'partial' ? FBT_PARTIAL_TAXABLE_FRACTION : 1
  return baseValue * FBT_STATUTORY_FRACTION * exposedFraction * FBT_TYPE2_GROSS_UP * FBT_RATE
}

/**
 * Annual post-tax ECM contribution required to reduce FBT to $0.
 * For partial exemption, only covers the 75% FBT-exposed portion of the taxable value.
 */
export function ecmAnnualContribution(baseValue: number, status: 'partial' | 'none'): number {
  const exposedFraction = status === 'partial' ? FBT_PARTIAL_TAXABLE_FRACTION : 1
  return baseValue * FBT_STATUTORY_FRACTION * exposedFraction
}
