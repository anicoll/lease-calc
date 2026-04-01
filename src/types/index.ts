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
  showLoanComparison: boolean
  loanComparisonRate: number
  loanComparisonResidual: number
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
  // Regular loan comparison (only populated when showLoanComparison is true)
  showLoanComparison: boolean
  loanComparisonRate: number
  comparisonMonthlyLoanPayment: number
  comparisonMonthlyTotal: number
  comparisonAnnualTotal: number
  annualSavingVsLoan: number
}

export interface AnalyserInputs {
  vehicleBaseValue: number
  termRemainingMonths: number
  monthlyPreTax: number
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

export interface EarlyTerminationInputs {
  vehicleBaseValue: number
  annualInterestRate: number        // decimal (e.g. 0.075 for 7.5%)
  originalTermMonths: number
  monthsElapsed: number
  residualValue: number
  monthlyLeasePayment: number | null  // null → derive via pmt()
  monthlyManagementFee: number        // 0 if not applicable
  terminationFee: number              // flat provider exit fee; 0 if none
  currentMarketValue: number | null   // null → skip equity calculation
  vehicleType: VehicleType
  phevDeliveredBeforeApril2025: boolean
  terminationDate: Date
}

export interface EarlyTerminationResult {
  monthsRemaining: number
  derivedMonthlyPayment: number
  financePayout: number
  remainingManagementFees: number
  terminationFee: number
  vehicleEquity: number | null
  isUnderwater: boolean | null
  fbtExempt: boolean
  partialYearFbtPayable: number
  daysUsedInFbtYear: number
  ecmAccountNote: string
  totalFinancialExposure: number | null
}
