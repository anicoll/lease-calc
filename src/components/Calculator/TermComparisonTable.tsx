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
  const fbtExempt = results[0]?.fbtExempt ?? true

  return (
    <div className="flex flex-col gap-4">
      <div
        className={[
          'rounded-xl px-4 py-3 text-sm font-medium',
          fbtExempt
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200',
        ].join(' ')}
      >
        {fbtExempt
          ? '✓ This vehicle qualifies for the FBT (Fringe Benefits Tax) exemption — no FBT applies.'
          : '⚠ FBT (Fringe Benefits Tax) applies to this vehicle. A post-tax ECM (Employee Contribution Method) contribution is required to eliminate FBT liability.'}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Lease Term Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-xs text-gray-500 font-medium w-48"></th>
                {results.map(r => {
                  const isSelected = r.termYears === selectedTerm
                  return (
                    <th key={r.termYears} className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectTerm(r.termYears)}
                        className={[
                          'w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
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
                <tr key={row.label} className={['border-t', row.total ? 'border-gray-300' : 'border-gray-100'].join(' ')}>
                  <td className={['py-2.5 pr-4 text-xs', row.total ? 'font-semibold text-gray-700' : 'text-gray-500'].join(' ')}>
                    {row.label}
                    {row.hint && (
                      <span className="block font-normal text-gray-400">{row.hint}</span>
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
                          isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-800',
                          row.total && isSelected ? 'font-bold' : '',
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
          <p className="text-xs text-gray-400 mt-3">Click a column to see the full breakdown below.</p>
        </div>
      </div>
    </div>
  )
}
