import { useState } from 'react'
import type { AnalyserInputs, AnalyserResult, EarlyTerminationInputs, EarlyTerminationResult, LeaseResult, MultiTermLeaseInputs } from './types'
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
import { calculateAllLeaseTerms, analyseExistingLease } from './lib/calculations/novatedLease'
import { calculateEarlyTermination } from './lib/calculations/earlyTermination'
import { DownloadPdfButton } from './components/ui/DownloadPdfButton'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator')
  const [leaseResults, setLeaseResults] = useState<LeaseResult[] | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null)
  const [analyserResult, setAnalyserResult] = useState<AnalyserResult | null>(null)
  const [terminationResult, setTerminationResult] = useState<EarlyTerminationResult | null>(null)

  function handleCalculate(inputs: MultiTermLeaseInputs) {
    setLeaseResults(calculateAllLeaseTerms(inputs))
    setSelectedTerm(null)
  }

  function handleAnalyse(inputs: AnalyserInputs) {
    setAnalyserResult(analyseExistingLease(inputs))
  }

  function handleTermination(inputs: EarlyTerminationInputs) {
    setTerminationResult(calculateEarlyTermination(inputs))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNav activeTab={activeTab} onChange={(tab) => { setActiveTab(tab) }} />

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {activeTab === 'calculator' ? (
          <InputForm onCalculate={handleCalculate} />
        ) : activeTab === 'analyser' ? (
          <>
            <AnalyserForm onAnalyse={handleAnalyse} />
            {analyserResult && <AnalyserResults result={analyserResult} />}
          </>
        ) : (
          <>
            <TerminationForm onCalculate={handleTermination} />
            {terminationResult && <TerminationResults result={terminationResult} />}
          </>
        )}
      </main>

      {activeTab === 'calculator' && leaseResults && (
        <div id="pdf-calculator-results" className="max-w-5xl mx-auto px-4 pb-6 flex flex-col gap-4">
          <TermComparisonTable
            results={leaseResults}
            selectedTerm={selectedTerm}
            onSelectTerm={setSelectedTerm}
          />
          {selectedTerm !== null && (
            <ResultsPanel result={leaseResults.find(r => r.termYears === selectedTerm)!} />
          )}
          <DownloadPdfButton elementId="pdf-calculator-results" filename="novated-lease-calculator.pdf" />
        </div>
      )}

      <footer className="text-center text-xs text-gray-400 pb-4 space-y-1">
        <p>
          This calculator is for educational purposes only and does not constitute financial or tax advice.
          Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change.
        </p>
        <p>Always consult a qualified financial adviser before entering into a novated lease arrangement.</p>
      </footer>
    </div>
  )
}
