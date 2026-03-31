import { useState } from 'react'
import type { AnalyserInputs, AnalyserResult, LeaseInputs, LeaseResult } from './types'
import { Header } from './components/Layout/Header'
import { TabNav } from './components/Layout/TabNav'
import { InputForm } from './components/Calculator/InputForm'
import { ResultsPanel } from './components/Calculator/ResultsPanel'
import { AnalyserForm } from './components/LeaseAnalyser/AnalyserForm'
import { AnalyserResults } from './components/LeaseAnalyser/AnalyserResults'
import { calculateNovatedLease, analyseExistingLease } from './lib/calculations/novatedLease'

type Tab = 'calculator' | 'analyser'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator')
  const [leaseResult, setLeaseResult] = useState<LeaseResult | null>(null)
  const [analyserResult, setAnalyserResult] = useState<AnalyserResult | null>(null)

  function handleCalculate(inputs: LeaseInputs) {
    setLeaseResult(calculateNovatedLease(inputs))
  }

  function handleAnalyse(inputs: AnalyserInputs) {
    setAnalyserResult(analyseExistingLease(inputs))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNav activeTab={activeTab} onChange={(tab) => { setActiveTab(tab) }} />

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        {activeTab === 'calculator' ? (
          <>
            <InputForm onCalculate={handleCalculate} />
            {leaseResult && <ResultsPanel result={leaseResult} />}
          </>
        ) : (
          <>
            <AnalyserForm onAnalyse={handleAnalyse} />
            {analyserResult && <AnalyserResults result={analyserResult} />}
          </>
        )}

        <footer className="text-center text-xs text-gray-400 pb-4 space-y-1">
          <p>
            This calculator is for educational purposes only and does not constitute financial or tax advice.
            Tax rates and thresholds are based on ATO 2024–25 figures and are subject to change.
          </p>
          <p>Always consult a qualified financial adviser before entering into a novated lease arrangement.</p>
        </footer>
      </main>
    </div>
  )
}
