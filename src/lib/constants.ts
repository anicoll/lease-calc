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
// Rates are estimates based on published 2024-25 schedules. Thresholds and
// concessions change — always verify with your state revenue office.
export function calculateStampDuty(
  vehiclePrice: number,
  vehicleType: VehicleType,
  state: AustralianState,
): number {
  switch (state) {
    case 'NSW':
      // No EV concession. $3/$100 up to $45k; $1,350 + $5/$100 above $45k.
      if (vehiclePrice <= 45_000) return vehiclePrice * 0.03
      return 1_350 + (vehiclePrice - 45_000) * 0.05

    case 'VIC':
      // EV/PHEV: $8.40 per $200 (4.2%). ICE: higher brackets up to $18/$200.
      // Road user charge may also apply separately for EVs.
      if (vehicleType === 'BEV' || vehicleType === 'PHEV') return vehiclePrice * 0.042
      return vehiclePrice * 0.055

    case 'QLD':
      // EV/PHEV: $2/$100 (no full exemption). ICE: $3/$100 ≤$100k, $5/$100 above
      // (assumes 4-cyl; higher-cylinder vehicles attract higher rates).
      if (vehicleType === 'BEV' || vehicleType === 'PHEV') return vehiclePrice * 0.02
      if (vehiclePrice <= 100_000) return vehiclePrice * 0.03
      return 3_000 + (vehiclePrice - 100_000) * 0.05

    case 'SA':
      // Marginal tiered rates on amount within each bracket. No EV concession.
      // <$1k: $5 min; $1k–$2k: $10 + $2/$100 over $1k; $2k–$3k: $30 + $3/$100 over $2k;
      // >$3k: $60 + $4/$100 over $3k.
      if (vehiclePrice < 1_000) return 5
      if (vehiclePrice < 2_000) return 10 + (vehiclePrice - 1_000) * 0.02
      if (vehiclePrice < 3_000) return 30 + (vehiclePrice - 2_000) * 0.03
      return 60 + (vehiclePrice - 3_000) * 0.04

    case 'WA':
      // No EV concession. Tiered: ≤$25k: 2.75%; $25k–$50k: formula ~4%; >$50k: 6.5%.
      if (vehiclePrice <= 25_000) return vehiclePrice * 0.0275
      if (vehiclePrice <= 50_000) return 687.5 + (vehiclePrice - 25_000) * 0.04
      return vehiclePrice * 0.065

    case 'TAS':
      // ≤$600: $20 flat; $600–$35k: $3/$100; $35k–$40k: $1,050 + $11/$100 of excess;
      // >$40k: $4/$100.
      if (vehiclePrice <= 600) return 20
      if (vehiclePrice < 35_000) return vehiclePrice * 0.03
      if (vehiclePrice < 40_000) return 1_050 + (vehiclePrice - 35_000) * 0.11
      return vehiclePrice * 0.04

    case 'ACT':
      // A-rated (BEV): exempt. B-rated (PHEV): ~$2/$100. C/non-rated (ICE): ~$3/$100.
      if (vehicleType === 'BEV') return 0
      if (vehicleType === 'PHEV') return vehiclePrice * 0.02
      return vehiclePrice * 0.03

    case 'NT':
      // 3% + $18 transfer fee. BEV ≤$50k: up to $1,500 concession (Jul 2022–Jun 2027).
      const duty = vehiclePrice * 0.03 + 18
      if (vehicleType === 'BEV' && vehiclePrice <= 50_000) return Math.max(0, duty - 1_500)
      return duty
  }
}
