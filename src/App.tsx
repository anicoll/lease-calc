import { useState, useEffect } from 'react'
import type { AnalyserInputs, AnalyserResult, EarlyTerminationInputs, EarlyTerminationResult, LeaseResult, MultiTermLeaseInputs, SavedQuote } from './types'
import { ChangelogModal } from './components/Layout/ChangelogModal'
import { ProfileSettingsModal } from './components/Layout/ProfileSettingsModal'
import { InputForm } from './components/Calculator/InputForm'
import { ResultsPanel } from './components/Calculator/ResultsPanel'
import { TermComparisonTable } from './components/Calculator/TermComparisonTable'
import { DashboardChart } from './components/Calculator/DashboardChart'
import { AnalyserForm } from './components/LeaseAnalyser/AnalyserForm'
import { AnalyserResults } from './components/LeaseAnalyser/AnalyserResults'
import { TerminationForm } from './components/EarlyTermination/TerminationForm'
import { TerminationResults } from './components/EarlyTermination/TerminationResults'
import { SavedQuotesList } from './components/Quotes/SavedQuotesList'
import { QuoteComparison } from './components/Quotes/QuoteComparison'
import { calculateAllLeaseTerms, analyseExistingLease } from './lib/calculations/novatedLease'
import { calculateEarlyTermination } from './lib/calculations/earlyTermination'
import { getSavedActiveTab, saveActiveTab, getThemePreference, saveThemePreference, getSavedQuotes, saveQuotes, saveCalculatorInputs } from './lib/storage'

type Tab = 'calculator' | 'quotes' | 'compare' | 'analyser' | 'termination'

const TAB_LABELS: Record<Tab, string> = {
  calculator: 'Calculator',
  quotes: 'Saved Quotes',
  compare: 'Compare Quotes',
  analyser: 'Lease Analyser',
  termination: 'Early Termination',
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => (getSavedActiveTab() as Tab) ?? 'calculator')
  const [showSettings, setShowSettings] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Calculation workflow states
  const [leaseResults, setLeaseResults] = useState<LeaseResult[] | null>(null)
  const [currentInputs, setCurrentInputs] = useState<MultiTermLeaseInputs | null>(null)
  const [currentRawInputs, setCurrentRawInputs] = useState<any | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)
  
  const [analyserResult, setAnalyserResult] = useState<AnalyserResult | null>(null)
  const [terminationResult, setTerminationResult] = useState<EarlyTerminationResult | null>(null)

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getThemePreference())

  // Saved quotes state
  const [quotes, setQuotes] = useState<SavedQuote[]>(() => getSavedQuotes())
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([])
  
  // Quote label states for saving from results dashboard
  const [quoteLabel, setQuoteLabel] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Update default quote label when inputs change
  useEffect(() => {
    if (currentInputs) {
      const formattedCost = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(currentInputs.vehicleCost || 0)
      setQuoteLabel(`${currentInputs.vehicleType === 'BEV' ? 'Tesla/EV' : currentInputs.vehicleType === 'PHEV' ? 'PHEV' : 'ICE'} (${formattedCost})`)
    }
  }, [currentInputs])

  function handleToggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    saveThemePreference(nextTheme)
  }

  function handleCalculate(inputs: MultiTermLeaseInputs, rawInputs: any) {
    setLeaseResults(calculateAllLeaseTerms(inputs))
    setCurrentInputs(inputs)
    setCurrentRawInputs(rawInputs)
    setSelectedTerm(3) // default to 3 years detail view
    setIsEditing(false) // Show results directly, hide input form
  }

  function handleAnalyse(inputs: AnalyserInputs) {
    setAnalyserResult(analyseExistingLease(inputs))
  }

  function handleTermination(inputs: EarlyTerminationInputs) {
    setTerminationResult(calculateEarlyTermination(inputs))
  }

  function handleReset() {
    setResetKey(prev => prev + 1)
    setLeaseResults(null)
    setCurrentInputs(null)
    setCurrentRawInputs(null)
    setSelectedTerm(null)
    setAnalyserResult(null)
    setTerminationResult(null)
    setIsEditing(false)
  }

  // Quote actions
  function handleSaveQuote(inputs: MultiTermLeaseInputs, label: string, rawInputs: any) {
    if (quotes.length >= 5) {
      return
    }
    const newQuote: SavedQuote = {
      id: Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      label,
      timestamp: Date.now(),
      inputs,
      rawInputs,
    }
    const updatedQuotes = [newQuote, ...quotes]
    setQuotes(updatedQuotes)
    saveQuotes(updatedQuotes)
  }

  function handleSaveCurrentQuote() {
    if (currentInputs && quotes.length < 5) {
      handleSaveQuote(currentInputs, quoteLabel.trim() || 'Lease Quote', currentRawInputs)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }


  function handleDeleteQuote(id: string) {
    const updatedQuotes = quotes.filter(q => q.id !== id)
    setQuotes(updatedQuotes)
    saveQuotes(updatedQuotes)
    setSelectedQuoteIds(prev => prev.filter(qId => qId !== id))
  }

  function handleLoadQuote(quote: SavedQuote) {
    if (quote.rawInputs) {
      saveCalculatorInputs(quote.rawInputs)
      setResetKey(prev => prev + 1)
      setLeaseResults(calculateAllLeaseTerms(quote.inputs))
      setCurrentInputs(quote.inputs)
      setCurrentRawInputs(quote.rawInputs)
      setSelectedTerm(3)
      setIsEditing(false) // Show results
      setActiveTab('calculator')
      saveActiveTab('calculator')
    }
  }

  function handleToggleSelectQuote(id: string) {
    setSelectedQuoteIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    )
  }

  function handleClearQuotesSelection() {
    setSelectedQuoteIds([])
  }


  // Render navigation tab list item
  const renderNavItem = (tab: Tab, icon: React.ReactNode) => {
    const isActive = activeTab === tab
    return (
      <button
        onClick={() => {
          setActiveTab(tab)
          saveActiveTab(tab)
          setIsSidebarOpen(false) // Close drawer on mobile
        }}
        className={[
          'w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer border',
          isActive
            ? 'bg-blue-600 text-white border-blue-700 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800'
            : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-900/60 dark:hover:text-slate-200'
        ].join(' ')}
      >
        <span className="flex items-center gap-3">
          {icon}
          <span>{TAB_LABELS[tab]}</span>
        </span>
        {tab === 'quotes' && quotes.length > 0 && (
          <span className={[
            'text-[10px] px-2 py-0.5 rounded-full font-bold',
            isActive
              ? 'bg-blue-700 text-white dark:bg-cyan-900/40 dark:text-cyan-300'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
          ].join(' ')}>
            {quotes.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col lg:flex-row">
      
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-slate-900 border-b border-slate-800 text-white dark:bg-slate-950 dark:border-slate-900 px-4 py-3 flex items-center justify-between z-40 sticky top-0 flex-shrink-0">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-1 rounded text-slate-400 hover:text-white focus:outline-none cursor-pointer"
          aria-label="Open navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent dark:from-cyan-400 dark:to-emerald-400 uppercase">
            Lease Calc
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">v2.0</span>
        </div>
        <button
          onClick={handleToggleTheme}
          className="p-1.5 rounded text-slate-400 hover:text-white cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* Navigation Sidebar (Desktop fixed, Mobile overlay drawer) */}
      <aside
        className={[
          'w-64 h-full flex flex-col bg-slate-900 border-r border-slate-800 text-white dark:bg-slate-950 dark:border-slate-900 transition-transform duration-300 lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-50 flex-shrink-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ].join(' ')}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800 dark:border-slate-900 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent dark:from-cyan-400 dark:to-emerald-400 uppercase">
                Lease Calc
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">FBT &amp; EV PACKAGING</p>
          </div>
          {/* Mobile close button */}
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
          {renderNavItem(
            'calculator',
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="15" y2="17"></line>
            </svg>
          )}
          {renderNavItem(
            'quotes',
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          )}
          {renderNavItem(
            'compare',
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
            </svg>
          )}
          {renderNavItem(
            'analyser',
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
            </svg>
          )}
          {renderNavItem(
            'termination',
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          )}
        </nav>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-slate-800 dark:border-slate-900 flex flex-col gap-2">
          {/* Desktop Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile Settings</span>
          </button>

          <button
            onClick={() => setShowChangelog(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Changelog</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Workspace Area (Only this scrolls) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col min-w-0 transition-colors duration-300">
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:px-8">
          
          {/* Header Title for Current Workspace view */}
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
              {activeTab === 'calculator' ? 'Lease Outcomes Dashboard' : TAB_LABELS[activeTab]}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === 'calculator'
                ? 'Configure parameters, review 1–5 yr term savings trends, and analyze calculations.'
                : `Manage settings and verify data for the ${TAB_LABELS[activeTab].toLowerCase()} scenario.`}
            </p>
          </div>

          {activeTab === 'calculator' ? (
            <div className="w-full">
              {/* Calculator View Workflow:
                  If no results yet or user clicked "Edit Parameters" -> Show configuration form centered.
                  If results are generated and user is not editing -> Show outcomes dashboard. */}
              {!leaseResults || isEditing ? (
                <div className="max-w-2xl mx-auto w-full">
                  <InputForm
                    key={`calculator-${resetKey}`}
                    onCalculate={handleCalculate}
                  />
                </div>
              ) : (
                <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full animate-fade-in">
                  
                  {/* Results Action Bar (Edit Parameters, Reset, and Save Quote) */}
                  <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit Parameters
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-800 dark:hover:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Quote Saving Segment */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {quotes.length >= 5 ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Quote limit reached (5/5). Delete a quote to save a new one.</span>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Quote label (e.g. Model Y)"
                            value={quoteLabel}
                            onChange={(e) => setQuoteLabel(e.target.value)}
                            className="flex-1 sm:w-48 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCurrentQuote}
                            className={[
                              'px-4 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap',
                              saveSuccess
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-200',
                            ].join(' ')}
                          >
                            {saveSuccess ? 'Saved! ✓' : 'Save Quote'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SVG Line Chart (1-5 Yr comparisons) */}
                  <DashboardChart
                    results={leaseResults}
                    selectedTerm={selectedTerm}
                    onSelectTerm={setSelectedTerm}
                  />

                  {/* Summary grid table */}
                  <TermComparisonTable
                    results={leaseResults}
                    selectedTerm={selectedTerm}
                    onSelectTerm={setSelectedTerm}
                  />

                  {/* Detailed 2x2 Outcome KPIs and metrics panel */}
                  {selectedTerm !== null && (
                    <ResultsPanel result={leaseResults.find(r => r.termYears === selectedTerm)!} />
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'quotes' ? (
            <SavedQuotesList
              quotes={quotes}
              selectedQuoteIds={selectedQuoteIds}
              onToggleSelect={handleToggleSelectQuote}
              onLoadQuote={handleLoadQuote}
              onDeleteQuote={handleDeleteQuote}
            />
          ) : activeTab === 'compare' ? (
            <QuoteComparison
              quotes={quotes}
              selectedQuoteIds={selectedQuoteIds}
              onToggleSelect={handleToggleSelectQuote}
              onClearSelection={handleClearQuotesSelection}
            />
          ) : activeTab === 'analyser' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className={analyserResult ? 'lg:col-span-5' : 'max-w-2xl mx-auto lg:col-span-12 w-full'}>
                <AnalyserForm key={`analyser-${resetKey}`} onAnalyse={handleAnalyse} />
              </div>
              {analyserResult && (
                <div className="lg:col-span-7 w-full">
                  <AnalyserResults result={analyserResult} />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className={terminationResult ? 'lg:col-span-5' : 'max-w-2xl mx-auto lg:col-span-12 w-full'}>
                <TerminationForm key={`termination-${resetKey}`} onCalculate={handleTermination} />
              </div>
              {terminationResult && (
                <div className="lg:col-span-7 w-full">
                  <TerminationResults result={terminationResult} />
                </div>
              )}
            </div>
          )}
        </main>

        <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 transition-colors duration-300 space-y-1 flex-shrink-0">
          <p className="max-w-2xl mx-auto px-4">
            This calculator is for educational purposes only and does not constitute financial or tax advice.
            Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change.
          </p>
          <p>Always consult a qualified financial adviser before entering into a novated lease arrangement.</p>
        </footer>
      </div>

      {showSettings && (
        <ProfileSettingsModal onClose={() => setShowSettings(false)} onReset={handleReset} />
      )}

      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </div>
  )
}
