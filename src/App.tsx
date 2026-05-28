import { useState, useEffect } from 'react'
import type { AnalyserInputs, AnalyserResult, EarlyTerminationInputs, EarlyTerminationResult, LeaseResult, MultiTermLeaseInputs, SavedQuote } from './types'
import { Header } from './components/Layout/Header'
import { TabNav } from './components/Layout/TabNav'
import type { Tab } from './components/Layout/TabNav'
import { InputForm } from './components/Calculator/InputForm'
import { ResultsPanel } from './components/Calculator/ResultsPanel'
import { TermComparisonTable } from './components/Calculator/TermComparisonTable'
import { AnalyserForm } from './components/LeaseAnalyser/AnalyserForm'
import { AnalyserResults } from './components/LeaseAnalyser/AnalyserResults'
import { TerminationForm } from './components/EarlyTermination/TerminationForm'
import { TerminationResults } from './components/EarlyTermination/TerminationResults'
import { SavedQuotesList } from './components/Quotes/SavedQuotesList'
import { QuoteComparison } from './components/Quotes/QuoteComparison'
import { calculateAllLeaseTerms, analyseExistingLease } from './lib/calculations/novatedLease'
import { calculateEarlyTermination } from './lib/calculations/earlyTermination'
import { DownloadPdfButton } from './components/ui/DownloadPdfButton'
import { getSavedActiveTab, saveActiveTab, getThemePreference, saveThemePreference, getSavedQuotes, saveQuotes, saveCalculatorInputs } from './lib/storage'
import { ProfileSettingsModal } from './components/Layout/ProfileSettingsModal'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => (getSavedActiveTab() as Tab) ?? 'calculator')
  const [showSettings, setShowSettings] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const [leaseResults, setLeaseResults] = useState<LeaseResult[] | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)
  const [analyserResult, setAnalyserResult] = useState<AnalyserResult | null>(null)
  const [terminationResult, setTerminationResult] = useState<EarlyTerminationResult | null>(null)

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getThemePreference())

  // Saved quotes state
  const [quotes, setQuotes] = useState<SavedQuote[]>(() => getSavedQuotes())
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([])

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  function handleToggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    saveThemePreference(nextTheme)
  }

  function handleCalculate(inputs: MultiTermLeaseInputs) {
    setLeaseResults(calculateAllLeaseTerms(inputs))
    setSelectedTerm(3) // default to 3 years detail view
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
    setSelectedTerm(null)
    setAnalyserResult(null)
    setTerminationResult(null)
  }

  // Quote actions
  function handleSaveQuote(inputs: MultiTermLeaseInputs, label: string, rawInputs: any) {
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
      setSelectedTerm(3)
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

  const selectedQuotesForComparison = quotes.filter(q => selectedQuoteIds.includes(q.id))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />
      <TabNav
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab)
          saveActiveTab(tab)
        }}
        savedQuotesCount={quotes.length}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form */}
            <div className={leaseResults ? 'lg:col-span-5' : 'max-w-2xl mx-auto lg:col-span-12 w-full'}>
              <InputForm
                key={`calculator-${resetKey}`}
                onCalculate={handleCalculate}
                onSaveQuote={handleSaveQuote}
              />
            </div>

            {/* Right Column: Outcomes Comparison & Detailed breakdown */}
            {leaseResults && (
              <div id="pdf-calculator-results" className="lg:col-span-7 flex flex-col gap-6 w-full">
                <TermComparisonTable
                  results={leaseResults}
                  selectedTerm={selectedTerm}
                  onSelectTerm={setSelectedTerm}
                />
                {selectedTerm !== null && (
                  <ResultsPanel result={leaseResults.find(r => r.termYears === selectedTerm)!} />
                )}
                <div className="flex justify-end mt-2">
                  <DownloadPdfButton elementId="pdf-calculator-results" filename="novated-lease-calculator.pdf" />
                </div>
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
            selectedQuotes={selectedQuotesForComparison}
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

      <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 transition-colors duration-300 space-y-1">
        <p className="max-w-2xl mx-auto px-4">
          This calculator is for educational purposes only and does not constitute financial or tax advice.
          Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change.
        </p>
        <p>Always consult a qualified financial adviser before entering into a novated lease arrangement.</p>
      </footer>

      {showSettings && (
        <ProfileSettingsModal onClose={() => setShowSettings(false)} onReset={handleReset} />
      )}
    </div>
  )
}
