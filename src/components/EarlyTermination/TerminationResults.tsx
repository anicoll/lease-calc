import type { EarlyTerminationResult } from '../../types'
import { DownloadPdfButton } from '../ui/DownloadPdfButton'
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
    bannerClass = 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/40 glow-cyan'
    bannerMessage = `Finance payout to exit the lease: ${fmt(result.financePayout)}. Enter a current market value to see your equity position.`
  } else if (underwater) {
    bannerClass = 'bg-red-50 text-red-800 border border-red-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 dark:shadow-[0_0_15px_rgba(244,63,94,0.15)]'
    bannerMessage = `Your vehicle is worth less than the finance payout. You are approximately ${fmt(Math.abs(result.vehicleEquity!))} underwater.`
  } else {
    bannerClass = 'bg-green-50 text-green-800 border border-green-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 glow-emerald'
    bannerMessage = `You have positive equity of ${fmt(result.vehicleEquity!)}. Your finance payout is ${fmt(result.financePayout)}.`
  }

  return (
    <div id="pdf-termination-results" className="flex flex-col gap-6">
      {/* Summary banner */}
      <div className={['rounded-xl px-4 py-3 text-sm font-semibold flex items-center justify-between border transition-all duration-300', bannerClass].join(' ')}>
        <span>{bannerMessage}</span>
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
          value={result.fbtExemptionStatus === 'full' ? 'Fully exempt' : result.fbtExemptionStatus === 'partial' ? 'Partial exemption (25%)' : 'Not exempt'}
          positive={result.fbtExemptionStatus === 'full'}
          hint={result.fbtExemptionStatus === 'full'
            ? 'Your vehicle qualifies for the full FBT exemption — no FBT is payable.'
            : result.fbtExemptionStatus === 'partial'
              ? 'Your vehicle qualifies for a 25% FBT exemption. 75% of standard FBT may be payable for the period the vehicle was used.'
              : 'Your vehicle does not qualify for the FBT exemption. FBT may be payable for the period the vehicle was used in this FBT year.'}
        />
        {result.fbtExemptionStatus !== 'full' && (
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
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{result.ecmAccountNote}</p>
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

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-2 leading-normal">
        This calculator is indicative only and does not constitute financial or tax advice.
        Finance payout figures should be confirmed with your novated lease provider.
        FBT obligations are your employer's responsibility — consult your payroll team or a tax adviser.
      </p>
      <DownloadPdfButton elementId="pdf-termination-results" filename="early-termination.pdf" />
    </div>
  )
}
