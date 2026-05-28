import { useState, useEffect } from 'react'
import type { AnalyserInputs } from '../../types'
import { InputField } from '../ui/InputField'
import { SectionCard } from '../ui/SectionCard'
import { getSavedAnalyserInputs, saveAnalyserInputs, getPreferences } from '../../lib/storage'

type PayPeriod = 'fortnightly' | 'monthly'

// Fortnightly → monthly: multiply by 26/12
const toMonthly = (value: number, period: PayPeriod) =>
  period === 'fortnightly' ? (value * 26) / 12 : value

interface AnalyserFormProps {
  onAnalyse: (inputs: AnalyserInputs) => void
}

export function AnalyserForm({ onAnalyse }: AnalyserFormProps) {
  const saved = getSavedAnalyserInputs()

  const [vehicleBaseValue, setVehicleBaseValue] = useState(saved?.vehicleBaseValue ?? '65000')
  const [termRemainingMonths, setTermRemainingMonths] = useState(saved?.termRemainingMonths ?? '60')
  const [payPeriod, setPayPeriod] = useState<PayPeriod>(saved?.payPeriod ?? 'fortnightly')
  const [preTax, setPreTax] = useState(saved?.preTax ?? '830')
  const [managementFee, setManagementFee] = useState(saved?.managementFee ?? '13')
  const [runningCosts, setRunningCosts] = useState(saved?.runningCosts ?? '500')
  const [benchmarkRate, setBenchmarkRate] = useState(saved?.benchmarkRate ?? '8.0')

  useEffect(() => {
    if (getPreferences().autoSave) {
      saveAnalyserInputs({
        vehicleBaseValue,
        termRemainingMonths,
        payPeriod,
        preTax,
        managementFee,
        runningCosts,
        benchmarkRate,
      })
    }
  }, [
    vehicleBaseValue,
    termRemainingMonths,
    payPeriod,
    preTax,
    managementFee,
    runningCosts,
    benchmarkRate,
  ])

  const inputCls = 'w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500'

  const periodLabel = payPeriod === 'fortnightly' ? 'fortnightly' : 'monthly'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAnalyse({
      vehicleBaseValue: parseFloat(vehicleBaseValue) || 0,
      termRemainingMonths: parseInt(termRemainingMonths) || 12,
      monthlyPreTax: toMonthly(parseFloat(preTax) || 0, payPeriod),
      monthlyManagementFee: parseFloat(managementFee) || 0,
      monthlyRunningCosts: parseFloat(runningCosts) || 0,
      benchmarkRate: parseFloat(benchmarkRate) / 100 || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="bg-blue-50 border border-blue-200 dark:bg-cyan-950/20 dark:border-cyan-900/40 dark:text-cyan-400 rounded-xl px-4 py-3 text-sm text-blue-800 glow-cyan leading-relaxed">
        Enter the details from your current novated lease agreement. The calculator will reverse-engineer
        the effective interest rate and fees being charged, and compare it to a benchmark.
      </div>

      <SectionCard title="Your Current Vehicle">
        <div className="flex flex-col gap-4">
          <InputField label="Vehicle base value" hint="Original purchase price (excluding LCT and stamp duty)">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={vehicleBaseValue}
                onChange={e => setVehicleBaseValue(e.target.value)} min="0" required />
            </div>
          </InputField>

          <InputField label="Remaining lease term" hint="In months">
            <div className="relative">
              <input type="number" className={inputCls + ' pr-16'} value={termRemainingMonths}
                onChange={e => setTermRemainingMonths(e.target.value)} min="1" max="60" required />
              <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-600 text-sm">months</span>
            </div>
          </InputField>
        </div>
      </SectionCard>

      {/* Salary deductions — fortnightly or monthly */}
      <SectionCard title="Salary Deductions">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pay period for deductions</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {(['fortnightly', 'monthly'] as PayPeriod[]).map(period => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPayPeriod(period)}
                  className={[
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                    payPeriod === period
                      ? 'bg-white text-blue-600 dark:bg-slate-950 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                  ].join(' ')}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <InputField
            label={`Pre-tax deduction (${periodLabel})`}
            hint="Total salary sacrifice amount per pay period (gross) — from your payslip"
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={preTax}
                onChange={e => setPreTax(e.target.value)} min="0" required />
            </div>
          </InputField>
        </div>
      </SectionCard>

      {/* Fixed monthly costs */}
      <SectionCard title="Monthly Costs">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Enter these as monthly amounts regardless of pay frequency.</p>

          <InputField label="Management / admin fee (monthly)" hint="Provider fee — check your lease agreement">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={managementFee}
                onChange={e => setManagementFee(e.target.value)} min="0" />
            </div>
          </InputField>

          <InputField label="Running costs budget (monthly)" hint="Fuel, rego, insurance, tyres, maintenance combined">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={runningCosts}
                onChange={e => setRunningCosts(e.target.value)} min="0" />
            </div>
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Benchmark">
        <InputField label="Benchmark interest rate" hint="Market rate to compare against (e.g. 7.5%)">
          <div className="relative">
            <input type="number" className={inputCls + ' pr-8'} value={benchmarkRate}
              onChange={e => setBenchmarkRate(e.target.value)} min="0" max="30" step="any" required />
            <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-600 text-sm">%</span>
          </div>
        </InputField>
      </SectionCard>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-bold rounded-xl py-3.5 text-base transition-colors shadow-md hover:shadow-lg cursor-pointer"
      >
        Analyse My Lease
      </button>
    </form>
  )
}
