import type { SavedQuote } from '../../types'

interface SavedQuotesListProps {
  quotes: SavedQuote[]
  onLoadQuote: (quote: SavedQuote) => void
  onDeleteQuote: (id: string) => void
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export function SavedQuotesList({
  quotes,
  onLoadQuote,
  onDeleteQuote,
}: SavedQuotesListProps) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No Saved Quotes Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Configure a lease in the **New Lease Calculator** and click the **"Save to Quotes"** button to store and compare different configurations.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Saved Quotes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare different vehicles or lease parameters to see which fits your budget.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {quotes.map((quote) => {
          const dateStr = new Date(quote.timestamp).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })

          return (
            <div
              key={quote.id}
              className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-slate-200 dark:border-l-slate-800 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {quote.label}
                  </h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{quote.inputs.vehicleType} • {quote.inputs.state}</span>
                    <span>•</span>
                    <span>Value: {fmt(quote.inputs.vehicleCost)}</span>
                    <span>•</span>
                    <span>Rate: {(quote.inputs.interestRate * 100).toFixed(2)}%</span>
                    <span>•</span>
                    <span>Saved: {dateStr}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => onLoadQuote(quote)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                  title="Load inputs into the calculator"
                >
                  Load to Calc
                </button>
                <button
                  onClick={() => onDeleteQuote(quote.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                  title="Delete quote"
                  aria-label="Delete quote"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

