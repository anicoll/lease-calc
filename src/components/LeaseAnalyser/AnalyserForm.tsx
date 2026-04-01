import { useState } from 'react'
import type { AnalyserInputs } from '../../types'
import { InputField } from '../ui/InputField'
import { SectionCard } from '../ui/SectionCard'

type PayPeriod = 'fortnightly' | 'monthly'

// Fortnightly → monthly: multiply by 26/12
const toMonthly = (value: number, period: PayPeriod) =>
  period === 'fortnightly' ? (value * 26) / 12 : value

interface AnalyserFormProps {
  onAnalyse: (inputs: AnalyserInputs) => void
}

export function AnalyserForm({ onAnalyse }: AnalyserFormProps) {
  const [vehicleBaseValue, setVehicleBaseValue] = useState('65000')
  const [termRemainingMonths, setTermRemainingMonths] = useState('60')
  const [payPeriod, setPayPeriod] = useState<PayPeriod>('fortnightly')
  const [preTax, setPreTax] = useState('830')
  const [managementFee, setManagementFee] = useState('100')
  const [runningCosts, setRunningCosts] = useState('500')
  const [benchmarkRate, setBenchmarkRate] = useState('7.5')

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        Enter the details from your current novated lease agreement. The calculator will reverse-engineer
        the effective interest rate and fees being charged, and compare to a benchmark.
      </div>

      <SectionCard title="Your Current Vehicle">
        <div className="flex flex-col gap-3">
          <InputField label="Vehicle base value" hint="Original purchase price (excluding LCT and stamp duty)">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={vehicleBaseValue}
                onChange={e => setVehicleBaseValue(e.target.value)} min="0" required />
            </div>
          </InputField>

          <InputField label="Remaining lease term" hint="In months">
            <div className="relative">
              <input type="number" className={inputCls + ' pr-16'} value={termRemainingMonths}
                onChange={e => setTermRemainingMonths(e.target.value)} min="1" max="60" required />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">months</span>
            </div>
          </InputField>
        </div>
      </SectionCard>

      {/* Salary deductions — fortnightly or monthly */}
      <SectionCard title="Salary Deductions">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Pay period for deductions</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['fortnightly', 'monthly'] as PayPeriod[]).map(period => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPayPeriod(period)}
                  className={[
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    payPeriod === period
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
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
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={preTax}
                onChange={e => setPreTax(e.target.value)} min="0" required />
            </div>
          </InputField>

        </div>
      </SectionCard>

      {/* Fixed monthly costs */}
      <SectionCard title="Monthly Costs">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">Enter these as monthly amounts regardless of pay frequency.</p>

          <InputField label="Management / admin fee (monthly)" hint="Provider fee — check your lease agreement">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input type="number" className={inputCls + ' pl-6'} value={managementFee}
                onChange={e => setManagementFee(e.target.value)} min="0" />
            </div>
          </InputField>

          <InputField label="Running costs budget (monthly)" hint="Fuel, rego, insurance, tyres, maintenance combined">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
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
            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
          </div>
        </InputField>
      </SectionCard>

      <button type="submit"
        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-3 text-base transition-colors shadow">
        Analyse My Lease
      </button>
    </form>
  )
}
