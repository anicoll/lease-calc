import type { AustralianState, VehicleType } from '../types'

// ── FBT ────────────────────────────────────────────────────────────────────
export const FBT_RATE = 0.47
export const FBT_TYPE2_GROSS_UP = 2.0802
export const FBT_STATUTORY_FRACTION = 0.20

// ── Luxury Car Tax (2024-25) ────────────────────────────────────────────────
export const LCT_THRESHOLD_FUEL_EFFICIENT = 91_387   // BEV, PHEV, efficient hybrids
export const LCT_THRESHOLD_GENERAL = 76_950           // all other vehicles
export const LCT_RATE = 0.33

// ── ATO Minimum Residual Values (safe harbour %) ───────────────────────────
export const ATO_RESIDUALS: Record<number, number> = {
  1: 0.6563,
  2: 0.5625,
  3: 0.4688,
  4: 0.3750,
  5: 0.2813,
}

// ── Income Tax 2024-25 ──────────────────────────────────────────────────────
export const TAX_BRACKETS = [
  { min: 0,       max: 18_200,  base: 0,      rate: 0     },
  { min: 18_201,  max: 45_000,  base: 0,      rate: 0.19  },
  { min: 45_001,  max: 135_000, base: 5_092,  rate: 0.325 },
  { min: 135_001, max: 190_000, base: 34_342, rate: 0.37  },
  { min: 190_001, max: Infinity,base: 55_042, rate: 0.45  },
]

// ── Medicare Levy ───────────────────────────────────────────────────────────
export const MEDICARE_LEVY_RATE = 0.02
export const MEDICARE_LOW_INCOME_THRESHOLD = 26_000   // singles 2024-25
export const MEDICARE_SHADE_IN_THRESHOLD = 32_500     // shade-in upper limit

// ── Low Income Tax Offset (LITO) ────────────────────────────────────────────
export const LITO_MAX = 700
export const LITO_PHASE_OUT_1_START = 37_500
export const LITO_PHASE_OUT_1_END   = 45_000
export const LITO_PHASE_OUT_1_RATE  = 0.015
export const LITO_PHASE_OUT_2_START = 45_000
export const LITO_PHASE_OUT_2_END   = 66_667
export const LITO_PHASE_OUT_2_RATE  = 0.005

// ── State Stamp Duty ────────────────────────────────────────────────────────
// Rates approximate for 2024-25. EV exemptions noted where applicable.
// DISCLAIMER: These rates change — users should verify with their state revenue office.
export function calculateStampDuty(
  vehiclePrice: number,
  vehicleType: VehicleType,
  state: AustralianState,
): number {
  const isEV = vehicleType === 'BEV'

  switch (state) {
    case 'NSW':
      // EVs: 2% (reduced rate, not full exemption). Standard: 3% up to $45k, 5% above.
      if (isEV) return vehiclePrice * 0.02
      if (vehiclePrice <= 45_000) return vehiclePrice * 0.03
      return 1_350 + (vehiclePrice - 45_000) * 0.05

    case 'VIC':
      // VIC abolished stamp duty for EVs/PHEVs in 2021
      if (vehicleType === 'BEV' || vehicleType === 'PHEV') return 0
      return vehiclePrice * 0.055

    case 'QLD':
      // QLD: EVs exempt. Standard: 3% up to $100k, 5% above.
      if (isEV) return 0
      if (vehiclePrice <= 100_000) return vehiclePrice * 0.03
      return 3_000 + (vehiclePrice - 100_000) * 0.05

    case 'SA':
      // SA: flat 4%, no EV exemption
      return vehiclePrice * 0.04

    case 'WA':
      // WA: EVs exempt. Standard: 2.75% flat (simplified).
      if (isEV) return 0
      return vehiclePrice * 0.0275

    case 'TAS':
      // TAS: flat 3%, no EV exemption
      return vehiclePrice * 0.03

    case 'ACT':
      // ACT: EVs exempt. Standard: ~3%.
      if (isEV) return 0
      return vehiclePrice * 0.03

    case 'NT':
      // NT: flat 3%, no EV exemption
      return vehiclePrice * 0.03
  }
}
