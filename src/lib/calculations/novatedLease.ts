import { calculateStampDuty } from '../constants'
import type { AnalyserInputs, AnalyserResult, LeaseResult, MultiTermLeaseInputs } from '../../types'
import { ecmAnnualContribution, getFbtExemptionStatus, getFbtPhaseWarning } from './fbt'
import { atoResidualPercent, impliedAnnualRate, lct, pmt, residualValue } from './lease'
import { totalTax } from './tax'

export function calculateNovatedLease(inputs: MultiTermLeaseInputs, termYears: number): LeaseResult {
  const {
    grossSalary,
    vehicleCost,
    vehicleType,
    phevDeliveredBeforeApril2025,
    leaseStartDate,
    grandfatheredLease,
    interestRate,
    showLoanComparison,
    loanComparisonRate,
    loanComparisonResidual,
    customResidualPercent,
    annualManagementFee,
    runningCosts,
    state,
  } = inputs

  // 1. FBT exemption status and any phase-crossing warning
  const fbtExemptionStatus = getFbtExemptionStatus(vehicleType, vehicleCost, leaseStartDate, phevDeliveredBeforeApril2025, grandfatheredLease)
  const fbtPhaseWarning = getFbtPhaseWarning(leaseStartDate, termYears, grandfatheredLease)

  // 2. LCT (federal, upfront cost shown separately)
  const lctApplied = lct(vehicleCost, vehicleType)

  // 3. Stamp duty (state, upfront)
  const stampDutyApplied = calculateStampDuty(vehicleCost, vehicleType, state)

  // 4. Residual
  const residualPercent = customResidualPercent ?? atoResidualPercent(termYears)
  const residual = residualValue(vehicleCost, residualPercent)

  // 5. Monthly lease payment (PMT on vehicle cost, not including LCT/stamp duty
  //    as those are typically upfront and financed separately or not at all)
  const monthlyRate = interestRate / 12
  const termMonths = termYears * 12
  const monthlyLeasePayment = pmt(monthlyRate, termMonths, vehicleCost, residual)
  const annualLeasePayment = monthlyLeasePayment * 12

  // 6. Running costs
  const annualRunningCosts =
    runningCosts.fuel +
    runningCosts.registration +
    runningCosts.insurance +
    runningCosts.tyres +
    runningCosts.maintenance

  // 7. Total pre-tax budget (lease + running costs + management fee)
  const totalPreTaxBudget = annualLeasePayment + annualRunningCosts + annualManagementFee

  // 8. Pre/post-tax split
  let annualPreTaxDeduction: number
  let annualPostTaxDeduction: number

  if (fbtExemptionStatus === 'full') {
    annualPreTaxDeduction = totalPreTaxBudget
    annualPostTaxDeduction = 0
  } else {
    // ECM funds part of the total package cost — it is not additional to it.
    // The employee's post-tax ECM contribution replaces pre-tax salary sacrifice up to
    // the total package cost; pre-tax covers the remainder.
    // For partial exemption, only 75% of the statutory taxable value needs to be covered.
    annualPostTaxDeduction = Math.min(ecmAnnualContribution(vehicleCost, fbtExemptionStatus), totalPreTaxBudget)
    annualPreTaxDeduction = Math.max(0, totalPreTaxBudget - annualPostTaxDeduction)
  }

  // 9. Tax saving
  const newTaxableIncome = Math.max(0, grossSalary - annualPreTaxDeduction)
  const taxBeforeSacrifice = totalTax(grossSalary)
  const taxAfterSacrifice = totalTax(newTaxableIncome)
  const annualTaxSaving = taxBeforeSacrifice - taxAfterSacrifice

  // 10. Net annual out-of-pocket cost
  //     (pre-tax + post-tax contributions, minus the tax saving from salary sacrifice)
  const netAnnualCost = annualPreTaxDeduction + annualPostTaxDeduction - annualTaxSaving
  const effectiveMonthlyOutOfPocket = netAnnualCost / 12

  // 11. Regular loan comparison (same vehicle cost, same term, $0 residual — standard P&I loan, no tax benefit, no management fee)
  const loanMonthlyRate = loanComparisonRate / 12
  const comparisonMonthlyLoanPayment = pmt(loanMonthlyRate, termMonths, vehicleCost, loanComparisonResidual)
  const comparisonMonthlyTotal = comparisonMonthlyLoanPayment + annualRunningCosts / 12
  const comparisonAnnualTotal = comparisonMonthlyTotal * 12
  const annualSavingVsLoan = comparisonAnnualTotal - netAnnualCost

  return {
    termYears,
    interestCost: (monthlyLeasePayment * termYears * 12) + residual - vehicleCost,
    fbtExemptionStatus,
    fbtPhaseWarning,
    lctApplied,
    stampDutyApplied,
    effectiveBaseValue: vehicleCost,
    residualValue: residual,
    residualPercent,
    monthlyLeasePayment,
    annualLeasePayment,
    annualRunningCosts,
    annualManagementFee,
    annualPreTaxDeduction,
    annualPostTaxDeduction,
    monthlyPreTaxDeduction: annualPreTaxDeduction / 12,
    monthlyPostTaxDeduction: annualPostTaxDeduction / 12,
    taxBeforeSacrifice,
    taxAfterSacrifice,
    annualTaxSaving,
    netAnnualCost,
    effectiveMonthlyOutOfPocket,
    newTaxableIncome,
    showLoanComparison,
    loanComparisonRate,
    comparisonMonthlyLoanPayment,
    comparisonMonthlyTotal,
    comparisonAnnualTotal,
    annualSavingVsLoan,
  }
}

export function calculateAllLeaseTerms(inputs: MultiTermLeaseInputs): LeaseResult[] {
  return [1, 2, 3, 4, 5].map(termYears => calculateNovatedLease(inputs, termYears))
}

export function analyseExistingLease(inputs: AnalyserInputs): AnalyserResult {
  const {
    vehicleBaseValue,
    termRemainingMonths,
    monthlyPreTax,
    monthlyManagementFee,
    monthlyRunningCosts,
    benchmarkRate,
  } = inputs

  // ATO residual: map remaining term to nearest whole year
  const termYears = Math.max(1, Math.min(5, Math.round(termRemainingMonths / 12)))
  const residualPercent = atoResidualPercent(termYears)
  const residual = residualValue(vehicleBaseValue, residualPercent)

  // Isolate the pure lease component from what the user is paying pre-tax
  const actualMonthlyLease = monthlyPreTax - monthlyManagementFee - monthlyRunningCosts

  // Implied interest rate from the actual lease payment
  const impliedRate = impliedAnnualRate(
    actualMonthlyLease,
    vehicleBaseValue,
    residual,
    termRemainingMonths,
  )

  // Benchmark lease payment at the user-supplied market rate
  const benchmarkMonthlyLease = pmt(benchmarkRate / 12, termRemainingMonths, vehicleBaseValue, residual)

  const monthlyOvercharge = actualMonthlyLease - benchmarkMonthlyLease
  const annualOvercharge = monthlyOvercharge * 12

  const managementFeePercent = vehicleBaseValue > 0
    ? (monthlyManagementFee * 12) / vehicleBaseValue
    : 0

  return {
    impliedInterestRate: impliedRate,
    benchmarkRate,
    benchmarkMonthlyLease,
    actualMonthlyLease,
    monthlyOvercharge,
    annualOvercharge,
    managementFeePercent,
    annualManagementFee: inputs.monthlyManagementFee * 12,
    residualValue: residual,
  }
}
