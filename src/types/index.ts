export type VehicleType = 'BEV' | 'PHEV' | 'ICE'

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT'

export interface RunningCosts {
  fuel: number
  registration: number
  insurance: number
  tyres: number
  maintenance: number
}

export interface LeaseInputs {
  grossSalary: number
  vehicleCost: number
  vehicleType: VehicleType
  phevDeliveredBeforeApril2025: boolean
  interestRate: number
  termYears: number
  customResidualPercent: number | null
  annualManagementFee: number
  runningCosts: RunningCosts
  state: AustralianState
}

export interface LeaseResult {
  fbtExempt: boolean
  lctApplied: number
  stampDutyApplied: number
  effectiveBaseValue: number
  residualValue: number
  residualPercent: number
  monthlyLeasePayment: number
  annualLeasePayment: number
  annualRunningCosts: number
  annualManagementFee: number
  annualPreTaxDeduction: number
  annualPostTaxDeduction: number
  monthlyPreTaxDeduction: number
  monthlyPostTaxDeduction: number
  taxBeforeSacrifice: number
  taxAfterSacrifice: number
  annualTaxSaving: number
  netAnnualCost: number
  effectiveMonthlyOutOfPocket: number
  newTaxableIncome: number
}

export interface AnalyserInputs {
  vehicleBaseValue: number
  termRemainingMonths: number
  monthlyPreTax: number
  monthlyPostTax: number
  monthlyManagementFee: number
  monthlyRunningCosts: number
  benchmarkRate: number
}

export interface AnalyserResult {
  impliedInterestRate: number | null
  benchmarkRate: number
  benchmarkMonthlyLease: number
  actualMonthlyLease: number
  monthlyOvercharge: number
  annualOvercharge: number
  managementFeePercent: number
  annualManagementFee: number
  residualValue: number
}
