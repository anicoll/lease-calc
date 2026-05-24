import type { AnalyserResult } from '../../types'
import { DownloadPdfButton } from '../ui/DownloadPdfButton'
import { ResultRow } from '../ui/ResultRow'
import { SectionCard } from '../ui/SectionCard'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + '%'
}

interface AnalyserResultsProps {
  result: AnalyserResult
}

export function AnalyserResults({ result }: AnalyserResultsProps) {
  const overcharging = result.monthlyOvercharge > 0
  const impliedRateStr = result.impliedInterestRate !== null
    ? fmtPct(result.impliedInterestRate)
    : 'Unable to calculate'

  return (
    <div id="pdf-analyser-results" className="flex flex-col gap-4">
      {/* Summary banner */}
      <div className={[
        'rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2',
        overcharging
          ? 'bg-red-50 text-red-800 border border-red-200'
          : 'bg-green-50 text-green-800 border border-green-200',
      ].join(' ')}>
        {overcharging ? (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
            </svg>
            <span>Based on this analysis, you may be paying approximately {fmt(result.annualOvercharge)} more per year than a benchmark lease at your chosen rate.</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
            </svg>
            <span>Your lease payments appear to be in line with (or below) the benchmark rate.</span>
          </>
        )}
      </div>

      <SectionCard title="Interest Rate Analysis">
        <ResultRow
          label="Implied interest rate"
          value={impliedRateStr}
          hint="The interest rate your provider is effectively charging on the vehicle finance component, reverse-engineered from your actual lease payment after stripping out the management fee and running costs. A higher implied rate means more interest cost over the lease term."
          negative={result.impliedInterestRate !== null && result.impliedInterestRate > 0.10}
        />
        <ResultRow
          label="Benchmark rate"
          value={fmtPct(result.benchmarkRate)}
          hint="The market interest rate you entered to compare against. This is what a competitive novated lease should cost. If the implied rate above is significantly higher than this, your provider may be charging above-market interest."
        />
      </SectionCard>

      <SectionCard title="Monthly Payment Breakdown">
        <ResultRow
          label="Actual monthly lease component"
          value={fmt(result.actualMonthlyLease)}
          hint="Pre-tax deduction minus management fee and running costs"
        />
        <ResultRow
          label="Benchmark monthly lease"
          value={fmt(result.benchmarkMonthlyLease)}
          hint="What the lease payment should be at the benchmark rate"
          positive
        />
        <ResultRow
          label="Monthly difference"
          value={fmt(result.monthlyOvercharge)}
          highlight
          negative={overcharging}
          positive={!overcharging}
        />
        <ResultRow
          label="Annual difference"
          value={fmt(result.annualOvercharge)}
          highlight
          negative={overcharging}
          positive={!overcharging}
        />
      </SectionCard>

      <SectionCard title="Fees">
        <ResultRow
          label="Management fee (annualised)"
          value={fmt(result.annualManagementFee)}
        />
        <ResultRow
          label="Management fee as % of vehicle value"
          value={fmtPct(result.managementFeePercent)}
          hint="Typical range: 1%–2% of vehicle value per year"
          negative={result.managementFeePercent > 0.02}
        />
      </SectionCard>

      <SectionCard title="Lease Structure">
        <ResultRow label="Residual value (ATO minimum)" value={fmt(result.residualValue)} />
      </SectionCard>

      <p className="text-xs text-gray-400 text-center px-2">
        This analysis is indicative only. Differences may reflect legitimate variations in lease structure,
        insurance inclusions, or other factors. Consult your provider or a financial adviser for detailed advice.
      </p>
      <DownloadPdfButton elementId="pdf-analyser-results" filename="lease-analyser.pdf" />
    </div>
  )
}
