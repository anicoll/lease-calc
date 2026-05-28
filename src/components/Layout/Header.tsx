import { useState } from 'react'
import { ChangelogModal } from './ChangelogModal'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenSettings: () => void
}

export function Header({ theme, onToggleTheme, onOpenSettings }: HeaderProps) {
  const [showChangelog, setShowChangelog] = useState(false)

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white dark:bg-slate-950 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent dark:from-cyan-400 dark:to-emerald-400">
                Novated Lease Calculator
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                v2.0
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Australian Salary Sacrificing &amp; EV Exemption Model</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                // Sun Icon for switching to light mode
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon for switching to dark mode
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Profile & Settings"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-sm py-1.5 px-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setShowChangelog(true)}
              aria-label="View changelog"
              title="What's new"
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors text-sm py-1.5 px-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
