import type { LeaseResult } from '../../types'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + '%'
}

interface Props {
  results: LeaseResult[]
  selectedTerm: number | null
  onSelectTerm: (term: number) => void
}

const ROWS: { label: string; render: (r: LeaseResult) => string; hint?: string; total?: boolean }[] = [
  { label: 'Monthly lease payment', render: r => fmt(r.monthlyLeasePayment) },
  { label: 'Residual value', render: r => `${fmt(r.residualValue)} (${fmtPct(r.residualPercent)})` },
  { label: 'Total interest cost', render: r => fmt(r.interestCost), hint: 'Total finance charges paid over the lease term' },
  { label: 'Annual tax saving', render: r => fmt(r.annualTaxSaving) },
  { label: 'Net annual out-of-pocket', render: r => fmt(r.netAnnualCost) },
  { label: 'Effective monthly out-of-pocket', render: r => fmt(r.effectiveMonthlyOutOfPocket) },
  {
    label: 'Total lifetime cost',
    render: r => fmt(r.netAnnualCost * r.termYears + r.residualValue),
    hint: 'Net out-of-pocket × years + residual. Assumes costs stay flat year to year.',
    total: true,
  },
]

export function TermComparisonTable({ results, selectedTerm, onSelectTerm }: Props) {
  const fbtStatus = results[0]?.fbtExemptionStatus ?? 'full'

  return (
    <div className="flex flex-col gap-4">
      <div
        className={[
          'rounded-xl px-4 py-3 text-sm font-semibold flex items-start gap-2.5 transition-all duration-300',
          fbtStatus === 'full'
            ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 glow-emerald'
            : fbtStatus === 'partial'
              ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/40 glow-cyan'
              : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 glow-indigo',
        ].join(' ')}
      >
        {fbtStatus === 'full' ? (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
            </svg>
            <span>FBT Exempt — this vehicle qualifies for the full FBT exemption. No FBT applies.</span>
          </>
        ) : fbtStatus === 'partial' ? (
          <>
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2V4a6 6 0 110 12z" clipRule="evenodd" />
            </svg>
            <span>Partial FBT Exemption (25% exempt) — 75% of standard FBT is payable. A reduced post-tax ECM contribution is required.</span>
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

      <div className="glass-panel overflow-x-auto shadow-sm">
        <div className="p-4 min-w-[500px]">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Lease Term Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-xs text-slate-400 font-semibold w-36 sticky left-0 bg-white dark:bg-slate-900/90 z-10"></th>
                {results.map(r => {
                  const isSelected = r.termYears === selectedTerm
                  return (
                    <th key={r.termYears} className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectTerm(r.termYears)}
                        className={[
                          'w-full rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-blue-600 text-white dark:bg-cyan-600 dark:text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                        ].join(' ')}
                      >
                        {r.termYears} {r.termYears === 1 ? 'Year' : 'Years'}
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.label} className={['border-t', row.total ? 'border-slate-300 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800'].join(' ')}>
                  <td className={['py-2.5 pr-4 text-xs sticky left-0 z-10', row.total ? 'font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/90' : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/90'].join(' ')}>
                    {row.label}
                    {row.hint && (
                      <span className="block font-normal text-slate-400 dark:text-slate-500">{row.hint}</span>
                    )}
                  </td>
                  {results.map(r => {
                    const isSelected = r.termYears === selectedTerm
                    return (
                      <td
                        key={r.termYears}
                        className={[
                          'py-2.5 px-3 text-center text-xs tabular-nums',
                          row.total ? 'font-bold' : '',
                          isSelected ? 'bg-blue-50/50 text-blue-900 dark:bg-cyan-950/20 dark:text-cyan-300 font-semibold' : 'text-slate-700 dark:text-slate-300',
                          row.total && isSelected ? 'font-extrabold text-blue-700 dark:text-cyan-400' : '',
                        ].join(' ')}
                      >
                        {row.render(r)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Click a term column header to expand details below.</p>
        </div>
      </div>
    </div>
  )
}
