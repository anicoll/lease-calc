import type { AnalyserResult } from '../../types'
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
    <div className="flex flex-col gap-4">
      {/* Summary banner */}
      <div className={[
        'rounded-xl px-4 py-3 text-sm font-medium',
        overcharging
          ? 'bg-red-50 text-red-800 border border-red-200'
          : 'bg-green-50 text-green-800 border border-green-200',
      ].join(' ')}>
        {overcharging
          ? `⚠ Based on this analysis, you may be paying approximately ${fmt(result.annualOvercharge)} more per year than a benchmark lease at your chosen rate.`
          : `✓ Your lease payments appear to be in line with (or below) the benchmark rate.`}
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
    </div>
  )
}
