export type Tab = 'calculator' | 'analyser' | 'termination'

const TAB_LABELS: Record<Tab, string> = {
  calculator: 'New Lease Calculator',
  analyser: 'Analyse My Lease',
  termination: 'Early Termination',
}

interface TabNavProps {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      <div className="max-w-2xl mx-auto w-full flex">
        {(['calculator', 'analyser', 'termination'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-700'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </div>
  )
}
