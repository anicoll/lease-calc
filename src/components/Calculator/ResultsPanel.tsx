import { useState } from 'react'
import type { LeaseResult } from '../../types'
import { ResultRow } from '../ui/ResultRow'
import { SectionCard } from '../ui/SectionCard'

type PayPeriod = 'monthly' | 'fortnightly'
const PERIODS_PER_YEAR: Record<PayPeriod, number> = { monthly: 12, fortnightly: 26 }

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
  const [period, setPeriod] = useState<PayPeriod>('monthly')
  const divisor = PERIODS_PER_YEAR[period]
  const periodLabel = period === 'monthly' ? 'monthly' : 'fortnightly'

  const perPeriod = (annual: number) => fmt(annual / divisor)

  // Calculations for KPIs
  const divisorFactor = period === 'monthly' ? 12 : 26
  const takeHomeVal = (result.newTaxableIncome - result.taxAfterSacrifice - result.annualPostTaxDeduction) / divisorFactor
  const leasePayVal = result.annualLeasePayment / divisorFactor
  const taxSavingsVal = result.annualTaxSaving / divisorFactor
  const outOfPocketVal = result.netAnnualCost / divisorFactor

  const kpis = [
    {
      label: `${period === 'monthly' ? 'Monthly' : 'Fortnightly'} Net Take Home`,
      value: fmt(takeHomeVal),
      hint: 'Your net income in hand per pay period after all salary sacrifices, ECM contributions, and income tax.',
      glowClass: 'glow-cyan border-cyan-500/10 text-slate-800 dark:text-cyan-400'
    },
    {
      label: `${period === 'monthly' ? 'Monthly' : 'Fortnightly'} Lease Payment`,
      value: fmt(leasePayVal),
      hint: 'The finance repayment portion of the lease paid out of pre-tax income.',
      glowClass: 'dark:border-slate-800 dark:text-slate-200 text-slate-800'
    },
    {
      label: `${period === 'monthly' ? 'Monthly' : 'Fortnightly'} Tax Savings`,
      value: fmt(taxSavingsVal),
      hint: 'The income tax and Medicare levy saved through salary sacrifice.',
      glowClass: 'glow-emerald border-emerald-500/10 text-green-600 dark:text-emerald-400'
    },
    {
      label: `${period === 'monthly' ? 'Monthly' : 'Fortnightly'} Out-of-Pocket`,
      value: fmt(outOfPocketVal),
      hint: 'The true effective out-of-pocket cost per period (lease + running costs + management fee minus tax savings).',
      glowClass: 'glow-indigo border-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* FBT Status Banner */}
      <div
        className={[
          'rounded-xl px-4 py-3 text-sm font-semibold flex items-start gap-2.5 transition-all duration-300',
          result.fbtExemptionStatus === 'full'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 glow-emerald'
            : result.fbtExemptionStatus === 'partial'
              ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/40 glow-cyan'
              : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 glow-indigo',
        ].join(' ')}
      >
        {result.fbtExemptionStatus === 'full' ? (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
            </svg>
            <span>FBT Exempt — this vehicle qualifies for the full FBT exemption. No FBT applies.</span>
          </>
        ) : result.fbtExemptionStatus === 'partial' ? (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2V4a6 6 0 110 12z" clipRule="evenodd" />
            </svg>
            <span>Partial FBT Exemption (25% exempt) — 75% of standard FBT is payable. A reduced ECM post-tax contribution is required.</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
            </svg>
            <span>FBT applies — a post-tax ECM (Employee Contribution Method) contribution is required to eliminate FBT liability.</span>
          </>
        )}
      </div>

      {/* FBT phase-crossing warning */}
      {result.fbtPhaseWarning && (
        <div className="rounded-xl px-4 py-3 text-sm bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/50 flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
          </svg>
          <span>{result.fbtPhaseWarning}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Key Outcomes ({periodLabel})</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['monthly', 'fortnightly'] as PayPeriod[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={[
                  'px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all cursor-pointer',
                  period === p
                    ? 'bg-white text-blue-600 dark:bg-slate-950 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                ].join(' ')}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className={[
                'glass-panel p-4.5 flex flex-col justify-between relative border',
                kpi.glowClass
              ].join(' ')}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                  {kpi.label}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold block mt-2 tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 leading-normal">
                {kpi.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

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
        {result.fbtExemptionStatus !== 'full' && (
          <ResultRow
            label="Post-tax ECM contribution"
            value={fmt(result.annualPostTaxDeduction)}
            negative
          />
        )}
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
        <ResultRow label="Vehicle price (used for calculations)" value={fmt(result.effectiveBaseValue)} hint="Drive-away price as entered — LCT and stamp duty are shown separately below as estimates" />
        <ResultRow
          label="Residual value"
          value={`${fmt(result.residualValue)} (${fmtPct(result.residualPercent)})`}
          hint="Amount owed or recovered at end of lease"
        />
        <ResultRow label="Monthly lease payment" value={fmt(result.monthlyLeasePayment)} />
      </SectionCard>

      {/* Regular loan comparison */}
      {result.showLoanComparison && (
        <SectionCard title="vs. Regular Car Loan">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-normal">
            Comparing your novated lease against a standard car loan at {(result.loanComparisonRate * 100).toFixed(2)}% p.a.
            Running costs are the same in both scenarios; no management fee applies to the loan.
          </p>
          <ResultRow
            label={`Regular loan repayment (${periodLabel})`}
            value={perPeriod(result.comparisonMonthlyLoanPayment * 12)}
            hint="Loan repayment only — paid from after-tax income"
          />
          <ResultRow
            label={`Running costs (${periodLabel})`}
            value={perPeriod(result.annualRunningCosts)}
            hint="Same running costs as your novated lease, paid from after-tax income"
          />
          <ResultRow
            label={`Regular loan total (${periodLabel})`}
            value={perPeriod(result.comparisonAnnualTotal)}
            highlight
          />
          <div className="border-t border-slate-100 dark:border-slate-800 mt-3 pt-3">
            <ResultRow
              label={`Novated lease out-of-pocket (${periodLabel})`}
              value={perPeriod(result.netAnnualCost)}
            />
            <ResultRow
              label={`${result.annualSavingVsLoan >= 0 ? 'Saving' : 'Extra cost'} with novated lease (${periodLabel})`}
              value={perPeriod(Math.abs(result.annualSavingVsLoan))}
              positive={result.annualSavingVsLoan >= 0}
              negative={result.annualSavingVsLoan < 0}
              hint={result.annualSavingVsLoan >= 0
                ? 'You save this amount by choosing a novated lease over a regular car loan'
                : 'The novated lease costs more than a regular car loan in this scenario'}
            />
          </div>
        </SectionCard>
      )}

      {/* LCT / Stamp Duty breakdown */}
      {(result.lctApplied > 0 || result.stampDutyApplied > 0) && (
        <SectionCard title="Estimated costs included in drive-away price">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-normal">
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
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            * Stamp duty rates are approximate and subject to change.
          </p>
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/50 rounded-lg px-3 py-2 mt-3 flex items-start gap-2.5 leading-normal">
            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path>
            </svg>
            <span>
              Stamp duty is estimated on your drive-away price, which already includes stamp duty itself. For a precise calculation, verify the pre-tax vehicle price with your provider.
            </span>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
