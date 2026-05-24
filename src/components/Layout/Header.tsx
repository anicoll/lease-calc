import { useState } from 'react'
import { ChangelogModal } from './ChangelogModal'

interface HeaderProps {
  onOpenSettings: () => void
}

export function Header({ onOpenSettings }: HeaderProps) {
  const [showChangelog, setShowChangelog] = useState(false)

  return (
    <>
      <header className="bg-blue-700 text-white px-4 py-4 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Novated Lease Calculator</h1>
            <p className="text-blue-200 text-sm mt-0.5">Australian FBT &amp; EV exemption calculator</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Profile & Settings"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hidden sm:inline">Profile &amp; Settings</span>
            </button>
            <button
              onClick={() => setShowChangelog(true)}
              aria-label="View changelog"
              title="What's new"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="hidden sm:inline">What's new</span>
            </button>
          </div>
        </div>
      </header>
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
    </>
  )
}
