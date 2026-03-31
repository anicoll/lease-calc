import type { LeaseResult } from '../../types'
import { ResultRow } from '../ui/ResultRow'
import { SectionCard } from '../ui/SectionCard'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + '%'
}

interface ResultsPanelProps {
  result: LeaseResult
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* FBT Status Banner */}
      <div
        className={[
          'rounded-xl px-4 py-3 text-sm font-medium',
          result.fbtExempt
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200',
        ].join(' ')}
      >
        {result.fbtExempt
          ? '✓ This vehicle qualifies for the FBT exemption — no Fringe Benefits Tax applies.'
          : '⚠ FBT applies to this vehicle. A post-tax ECM contribution is required to eliminate FBT.'}
      </div>

      {/* Monthly Summary */}
      <SectionCard title="Monthly Payments">
        <ResultRow
          label="Pre-tax salary sacrifice (monthly)"
          value={fmt(result.monthlyPreTaxDeduction)}
          hint="Deducted from gross salary before income tax is calculated"
        />
        {!result.fbtExempt && (
          <ResultRow
            label="Post-tax ECM contribution (monthly)"
            value={fmt(result.monthlyPostTaxDeduction)}
            negative
            hint="Required after-tax contribution to eliminate FBT (Employee Contribution Method)"
          />
        )}
        <ResultRow
          label="Effective out-of-pocket (monthly)"
          value={fmt(result.effectiveMonthlyOutOfPocket)}
          highlight
          hint="Net cost after income tax savings. Does not include upfront LCT or stamp duty."
        />
      </SectionCard>

      {/* Annual Summary */}
      <SectionCard title="Annual Breakdown">
        <ResultRow label="Annual lease payments" value={fmt(result.annualLeasePayment)} indent />
        <ResultRow label="Annual running costs" value={fmt(result.annualRunningCosts)} indent />
        <ResultRow label="Management fee" value={fmt(result.annualManagementFee)} indent />
        <ResultRow
          label="Total pre-tax salary sacrifice"
          value={fmt(result.annualPreTaxDeduction)}
          highlight
        />
        {!result.fbtExempt && (
          <ResultRow
            label="Post-tax ECM contribution"
            value={fmt(result.annualPostTaxDeduction)}
            negative
          />
        )}
        <ResultRow
          label="Annual income tax saving"
          value={fmt(result.annualTaxSaving)}
          positive
          hint="Tax you save by reducing your taxable income through salary sacrifice"
        />
        <ResultRow
          label="Net annual cost"
          value={fmt(result.netAnnualCost)}
          highlight
        />
      </SectionCard>

      {/* Tax Details */}
      <SectionCard title="Tax Details">
        <ResultRow
          label="New taxable income"
          value={fmt(result.newTaxableIncome)}
          hint="Salary after pre-tax sacrifice — this is what income tax is calculated on"
        />
        <ResultRow label="Tax before salary sacrifice" value={fmt(result.taxBeforeSacrifice)} />
        <ResultRow label="Tax after salary sacrifice" value={fmt(result.taxAfterSacrifice)} />
        <ResultRow label="Annual tax saving" value={fmt(result.annualTaxSaving)} positive />
      </SectionCard>

      {/* Lease Details */}
      <SectionCard title="Lease Details">
        <ResultRow label="Drive-away price (financed)" value={fmt(result.effectiveBaseValue)} />
        <ResultRow
          label="Residual value"
          value={`${fmt(result.residualValue)} (${fmtPct(result.residualPercent)})`}
          hint="Amount owed or recovered at end of lease"
        />
        <ResultRow label="Monthly lease payment" value={fmt(result.monthlyLeasePayment)} />
      </SectionCard>

      {/* LCT / Stamp Duty breakdown */}
      {(result.lctApplied > 0 || result.stampDutyApplied > 0) && (
        <SectionCard title="Estimated costs included in drive-away price">
          <p className="text-xs text-gray-500 mb-2">
            These charges are already part of the drive-away price you entered and are financed within the lease.
          </p>
          {result.lctApplied > 0 && (
            <ResultRow
              label="Luxury Car Tax (federal)"
              value={fmt(result.lctApplied)}
              hint="33% on the GST-exclusive amount above the LCT threshold ($91,387 for EVs/PHEVs, $76,950 for other vehicles). Estimated from your drive-away price."
            />
          )}
          {result.stampDutyApplied > 0 && (
            <ResultRow
              label="Stamp duty (state, estimated)"
              value={fmt(result.stampDutyApplied)}
              hint="State government duty applied to the vehicle purchase price. Rates are approximate — verify with your state revenue office."
            />
          )}
          <p className="text-xs text-gray-400 mt-2">
            * Stamp duty rates are approximate and subject to change.
          </p>
        </SectionCard>
      )}
    </div>
  )
}
