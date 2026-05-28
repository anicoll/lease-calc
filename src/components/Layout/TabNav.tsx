export type Tab = 'calculator' | 'quotes' | 'compare' | 'analyser' | 'termination'

const TAB_LABELS: Record<Tab, string> = {
  calculator: 'Calculator Dashboard',
  quotes: 'Saved Quotes',
  compare: 'Compare Quotes',
  analyser: 'Lease Analyser',
  termination: 'Early Termination',
}

interface TabNavProps {
  activeTab: Tab
  onChange: (tab: Tab) => void
  savedQuotesCount?: number
}

export function TabNav({ activeTab, onChange, savedQuotesCount = 0 }: TabNavProps) {
  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur-md transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {(['calculator', 'quotes', 'compare', 'analyser', 'termination'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => onChange(tab)}
                className={[
                  'relative py-3.5 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2',
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-cyan-500 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                ].join(' ')}
              >
                <span>{TAB_LABELS[tab]}</span>
                {tab === 'quotes' && savedQuotesCount > 0 && (
                  <span className={[
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-cyan-950 dark:text-cyan-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  ].join(' ')}>
                    {savedQuotesCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
