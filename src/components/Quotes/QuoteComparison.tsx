import { useState } from 'react'
import type { SavedQuote } from '../../types'
import { calculateNovatedLease } from '../../lib/calculations/novatedLease'

interface QuoteComparisonProps {
  quotes: SavedQuote[]
  selectedQuoteIds: string[]
  onToggleSelect: (id: string) => void
  onClearSelection: () => void
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function fmtPct(n: number): string {
  return (n * 100).toFixed(2) + '%'
}

export function QuoteComparison({
  quotes,
  selectedQuoteIds,
  onToggleSelect,
  onClearSelection,
}: QuoteComparisonProps) {
  const [compareTerm, setCompareTerm] = useState<number>(3)

  // Empty state if no quotes exist in the app at all
  if (quotes.length === 0) {
    return (
      <div className="glass-panel p-8 text-center max-w-2xl mx-auto my-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No Saved Quotes Available</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Configure a lease in the **Calculator** and save it as a quote first before comparing different configurations.
        </p>
      </div>
    )
  }

  const selectedQuotes = quotes.filter((q) => selectedQuoteIds.includes(q.id))

  // Calculate results for selected comparison term
  const comparisonResults = selectedQuotes.map((q) => {
    const result = calculateNovatedLease(q.inputs, compareTerm)
    return {
      quote: q,
      result,
      term: compareTerm,
    }
  })

  // Find lowest out-of-pocket to highlight
  const lowestOutOfPocketIndex = comparisonResults.reduce(
    (bestIdx, item, idx, arr) =>
      item.result.effectiveMonthlyOutOfPocket < arr[bestIdx].result.effectiveMonthlyOutOfPocket ? idx : bestIdx,
    0
  )

  const rows = [
    {
      label: 'Vehicle Price',
      value: (item: typeof comparisonResults[0]) => fmt(item.quote.inputs.vehicleCost),
    },
    {
      label: 'Vehicle Type',
      value: (item: typeof comparisonResults[0]) => item.quote.inputs.vehicleType === 'BEV'
        ? 'Electric (BEV)'
        : item.quote.inputs.vehicleType === 'PHEV'
          ? 'Plug-in Hybrid'
          : 'Petrol/Diesel/ICE',
    },
    {
      label: 'Comparison Term',
      value: (item: typeof comparisonResults[0]) => `${item.term} ${item.term === 1 ? 'Year' : 'Years'}`,
    },
    {
      label: 'FBT Status',
      value: (item: typeof comparisonResults[0]) => item.result.fbtExemptionStatus === 'full'
        ? 'Exempt'
        : item.result.fbtExemptionStatus === 'partial'
          ? 'Partial (25% Exempt)'
          : 'FBT Applies',
      className: (item: typeof comparisonResults[0]) =>
        item.result.fbtExemptionStatus === 'full'
          ? 'text-green-600 dark:text-emerald-400 font-medium'
          : item.result.fbtExemptionStatus === 'partial'
            ? 'text-blue-600 dark:text-cyan-400 font-medium'
            : 'text-amber-600 dark:text-amber-400 font-medium',
    },
    {
      label: 'Interest Rate',
      value: (item: typeof comparisonResults[0]) => `${(item.quote.inputs.interestRate * 100).toFixed(2)}%`,
    },
    {
      label: 'Pre-Tax Monthly Sacrifice',
      value: (item: typeof comparisonResults[0]) => fmt(item.result.monthlyPreTaxDeduction),
    },
    {
      label: 'Post-Tax Monthly (ECM)',
      value: (item: typeof comparisonResults[0]) => fmt(item.result.monthlyPostTaxDeduction),
    },
    {
      label: 'Annual Tax Saving',
      value: (item: typeof comparisonResults[0]) => fmt(item.result.annualTaxSaving),
      className: () => 'text-green-600 dark:text-emerald-400 font-semibold',
    },
    {
      label: 'Residual Value (Balloon)',
      value: (item: typeof comparisonResults[0]) =>
        `${fmt(item.result.residualValue)} (${fmtPct(item.result.residualPercent)})`,
    },
    {
      label: 'Monthly Out-of-pocket',
      value: (item: typeof comparisonResults[0]) => fmt(item.result.effectiveMonthlyOutOfPocket),
      highlight: true,
    },
    {
      label: 'Total Lifetime Cost',
      value: (item: typeof comparisonResults[0]) => fmt(item.result.netAnnualCost * item.term + item.result.residualValue),
      hint: 'Net out-of-pocket cost over the full term + residual (balloon) value at end.',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Quote Comparison</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Toggle quotes below to compare their lease outcomes side-by-side.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {selectedQuotes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Term:</span>
              <select
                value={compareTerm}
                onChange={(e) => setCompareTerm(parseInt(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map((t) => (
                  <option key={t} value={t}>
                    {t} {t === 1 ? 'Year' : 'Years'}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedQuoteIds.length > 0 && (
            <button
              onClick={onClearSelection}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Clear Comparison
            </button>
          )}
        </div>
      </div>

      {/* Quote Selector Checklist Header Card */}
      <div className="glass-panel p-5 mb-6 flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Select Saved Quotes to Display
        </span>
        <div className="flex flex-wrap gap-2.5 mt-1.5">
          {quotes.map((q) => {
            const isSelected = selectedQuoteIds.includes(q.id)
            return (
              <label
                key={q.id}
                className={[
                  'flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-blue-50/60 border-blue-400 text-blue-700 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-400 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-800',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(q.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:checked:bg-cyan-500"
                />
                <span>{q.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {selectedQuotes.length < 2 ? (
        <div className="glass-panel p-8 text-center max-w-2xl mx-auto my-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 mx-auto text-blue-500 dark:text-cyan-500 mb-4 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Compare Quotes</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Please check the boxes next to at least **two quotes** in the select list above to compare their specifications side-by-side.
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-x-auto shadow-md">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/4">
                  Metric
                </th>
                {comparisonResults.map((item, idx) => {
                  const isBest = idx === lowestOutOfPocketIndex
                  return (
                    <th
                      key={item.quote.id}
                      className={[
                        'p-4 text-center border-l border-slate-100 dark:border-slate-800 relative',
                        isBest ? 'bg-blue-50/10 dark:bg-slate-900/40' : '',
                      ].join(' ')}
                    >
                      {isBest && (
                        <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 text-[10px] font-bold px-2 py-0.5 rounded-b-md bg-emerald-500 text-white dark:bg-emerald-600 uppercase tracking-wider shadow-sm">
                          Best Option
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {item.quote.label}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {item.quote.inputs.state} State
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={[
                    'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors',
                    row.highlight ? 'bg-slate-50/50 dark:bg-slate-900/20 font-semibold' : '',
                  ].join(' ')}
                >
                  <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>{row.label}</span>
                      {row.hint && (
                        <span className="group relative cursor-help text-slate-400 hover:text-slate-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-48 rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            {row.hint}
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  {comparisonResults.map((item, idx) => {
                    const isBest = idx === lowestOutOfPocketIndex
                    const customClass = row.className ? row.className(item) : ''
                    return (
                      <td
                        key={item.quote.id}
                        className={[
                          'p-4 text-center border-l border-slate-100 dark:border-slate-800 tabular-nums text-sm',
                          isBest ? 'bg-blue-50/10 dark:bg-slate-900/40' : '',
                          row.highlight && isBest ? 'text-blue-600 dark:text-cyan-400 font-bold text-base' : '',
                          row.highlight && !isBest ? 'text-slate-800 dark:text-slate-200 font-bold text-base' : '',
                          !row.highlight ? 'text-slate-700 dark:text-slate-300' : '',
                          customClass,
                        ].join(' ')}
                      >
                        {row.value(item)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
