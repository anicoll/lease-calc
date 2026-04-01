import type { EarlyTerminationResult } from '../../types'
import { ResultRow } from '../ui/ResultRow'
import { SectionCard } from '../ui/SectionCard'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

interface TerminationResultsProps {
  result: EarlyTerminationResult
}

export function TerminationResults({ result }: TerminationResultsProps) {
  const hasEquity = result.vehicleEquity !== null
  const underwater = result.isUnderwater === true

  // Banner style and message
  let bannerClass: string
  let bannerMessage: string
  if (!hasEquity) {
    bannerClass = 'bg-blue-50 text-blue-800 border border-blue-200'
    bannerMessage = `Finance payout to exit the lease: ${fmt(result.financePayout)}. Enter a current market value to see your equity position.`
  } else if (underwater) {
    bannerClass = 'bg-red-50 text-red-800 border border-red-200'
    bannerMessage = `Your vehicle is worth less than the finance payout. You are approximately ${fmt(Math.abs(result.vehicleEquity!))} underwater.`
  } else {
    bannerClass = 'bg-amber-50 text-amber-800 border border-amber-200'
    bannerMessage = `You have positive equity of ${fmt(result.vehicleEquity!)}. Your finance payout is ${fmt(result.financePayout)}.`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary banner */}
      <div className={['rounded-xl px-4 py-3 text-sm font-medium', bannerClass].join(' ')}>
        {bannerMessage}
      </div>

      {/* Finance payout */}
      <SectionCard title="Finance Payout">
        <ResultRow
          label="Months remaining"
          value={result.monthsRemaining.toString()}
        />
        <ResultRow
          label="Monthly payment used"
          value={fmt(result.derivedMonthlyPayment)}
          hint="Your supplied payment, or derived from lease terms if left blank"
        />
        <ResultRow
          label="Finance payout"
          value={fmt(result.financePayout)}
          highlight
          hint="Present value of remaining monthly payments plus the residual — what the finance company will charge to exit the lease"
        />
        {result.remainingManagementFees > 0 && (
          <ResultRow
            label="Remaining management fees"
            value={fmt(result.remainingManagementFees)}
            negative
            hint="Monthly management fee charged for all remaining months"
          />
        )}
        {result.terminationFee > 0 && (
          <ResultRow
            label="Early termination fee"
            value={fmt(result.terminationFee)}
            negative
            hint="Flat exit fee charged by your provider"
          />
        )}
      </SectionCard>

      {/* Vehicle equity — only shown if market value was provided */}
      {hasEquity && (
        <SectionCard title="Vehicle Equity">
          <ResultRow
            label="Current market value"
            value={fmt(result.vehicleEquity! + result.financePayout)}
          />
          <ResultRow
            label="Finance payout"
            value={fmt(result.financePayout)}
          />
          <ResultRow
            label={underwater ? 'Shortfall (underwater)' : 'Vehicle equity'}
            value={fmt(Math.abs(result.vehicleEquity!))}
            highlight
            negative={underwater}
            positive={!underwater}
            hint={underwater
              ? 'The vehicle is worth less than the payout. You would need to fund this shortfall out of pocket.'
              : 'The vehicle is worth more than the payout. This equity could offset your exit costs.'}
          />
        </SectionCard>
      )}

      {/* FBT exposure */}
      <SectionCard title="FBT Exposure">
        <ResultRow
          label="FBT status"
          value={result.fbtExempt ? 'Exempt' : 'Not exempt'}
          positive={result.fbtExempt}
          hint={result.fbtExempt
            ? 'Your vehicle qualifies for the FBT exemption — no FBT is payable.'
            : 'Your vehicle does not qualify for the FBT exemption. FBT may be payable for the period the vehicle was used in this FBT year.'}
        />
        {!result.fbtExempt && (
          <>
            <ResultRow
              label="Days used in current FBT year"
              value={result.daysUsedInFbtYear.toString()}
              hint="Counted from the later of 1 April and your lease start date, to the termination date"
            />
            <ResultRow
              label="Partial-year FBT payable"
              value={fmt(result.partialYearFbtPayable)}
              highlight
              negative={result.partialYearFbtPayable > 0}
              hint="Prorated FBT using the statutory formula method. Your employer is responsible for this — discuss with your payroll or HR team."
            />
          </>
        )}
      </SectionCard>

      {/* ECM account note */}
      <SectionCard title="ECM / Running Costs Account">
        <p className="text-sm text-gray-600">{result.ecmAccountNote}</p>
      </SectionCard>

      {/* Summary — only shown if market value was provided */}
      {hasEquity && result.totalFinancialExposure !== null && (
        <SectionCard title="Summary">
          <ResultRow label="Finance payout" value={fmt(result.financePayout)} />
          {result.remainingManagementFees > 0 && (
            <ResultRow
              label="Plus: remaining management fees"
              value={fmt(result.remainingManagementFees)}
              negative
              indent
            />
          )}
          {result.terminationFee > 0 && (
            <ResultRow
              label="Plus: termination fee"
              value={fmt(result.terminationFee)}
              negative
              indent
            />
          )}
          {result.partialYearFbtPayable > 0 && (
            <ResultRow
              label="Plus: FBT payable"
              value={fmt(result.partialYearFbtPayable)}
              negative
              indent
            />
          )}
          {!underwater && result.vehicleEquity! > 0 && (
            <ResultRow
              label="Less: vehicle equity"
              value={`−${fmt(result.vehicleEquity!)}`}
              positive
              indent
            />
          )}
          <ResultRow
            label="Total financial exposure"
            value={fmt(result.totalFinancialExposure)}
            highlight
            negative={result.totalFinancialExposure > 0}
            hint="Net out-of-pocket cost to exit the lease, accounting for all fees, FBT, and vehicle equity"
          />
        </SectionCard>
      )}

      <p className="text-xs text-gray-400 text-center px-2">
        This calculator is indicative only and does not constitute financial or tax advice.
        Finance payout figures should be confirmed with your novated lease provider.
        FBT obligations are your employer's responsibility — consult your payroll team or a tax adviser.
      </p>
    </div>
  )
}
