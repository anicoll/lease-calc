import { useState } from 'react'
import type { AustralianState, LeaseInputs, RunningCosts, VehicleType } from '../../types'
import { InputField } from '../ui/InputField'
import { SectionCard } from '../ui/SectionCard'
import { ATO_RESIDUALS } from '../../lib/constants'

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']

interface InputFormProps {
  onCalculate: (inputs: LeaseInputs) => void
}

export function InputForm({ onCalculate }: InputFormProps) {
  const [grossSalary, setGrossSalary] = useState('120000')
  const [vehicleCost, setVehicleCost] = useState('65000')
  const [vehicleType, setVehicleType] = useState<VehicleType>('BEV')
  const [phevBefore, setPhevBefore] = useState(true)
  const [interestRate, setInterestRate] = useState('7.5')
  const [showLoanComparison, setShowLoanComparison] = useState(false)
  const [loanComparisonRate, setLoanComparisonRate] = useState('9.0')
  const [loanComparisonResidual, setLoanComparisonResidual] = useState('0')
  const [termYears, setTermYears] = useState('5')
  const [useCustomResidual, setUseCustomResidual] = useState(false)
  const [customResidual, setCustomResidual] = useState('')
  const [managementFee, setManagementFee] = useState('100')
  const [state, setState] = useState<AustralianState>('NSW')

  const [runningCostPeriod, setRunningCostPeriod] = useState<'monthly' | 'annual'>('monthly')
  const [fuel, setFuel] = useState('210')
  const [registration, setRegistration] = useState('70')
  const [insurance, setInsurance] = useState('125')
  const [tyres, setTyres] = useState('50')
  const [maintenance, setMaintenance] = useState('65')

  const atoResidual = ATO_RESIDUALS[parseInt(termYears)] ?? ATO_RESIDUALS[5]!

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const multiplier = runningCostPeriod === 'monthly' ? 12 : 1
    const runningCosts: RunningCosts = {
      fuel: (parseFloat(fuel) || 0) * multiplier,
      registration: (parseFloat(registration) || 0) * multiplier,
      insurance: (parseFloat(insurance) || 0) * multiplier,
      tyres: (parseFloat(tyres) || 0) * multiplier,
      maintenance: (parseFloat(maintenance) || 0) * multiplier,
    }
    const customResidualPercent =
      useCustomResidual && customResidual ? parseFloat(customResidual) / 100 : null

    onCalculate({
      grossSalary: parseFloat(grossSalary) || 0,
      vehicleCost: parseFloat(vehicleCost) || 0,
      vehicleType,
      phevDeliveredBeforeApril2025: phevBefore,
      interestRate: parseFloat(interestRate) / 100 || 0,
      showLoanComparison,
      loanComparisonRate: showLoanComparison ? (parseFloat(loanComparisonRate) / 100 || 0) : 0,
      loanComparisonResidual: showLoanComparison ? (parseFloat(loanComparisonResidual) || 0) : 0,
      termYears: parseInt(termYears) || 5,
      customResidualPercent,
      annualManagementFee: (parseFloat(managementFee) || 0) * 12,
      runningCosts,
      state,
    })
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const selectCls = inputCls

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SectionCard title="Your Details">
        <div className="flex flex-col gap-3">
          <InputField label="Annual gross salary" hint="Before tax, in Australian dollars">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                value={grossSalary}
                onChange={e => setGrossSalary(e.target.value)}
                min="0"
               
                required
              />
            </div>
          </InputField>

          <InputField label="State">
            <select className={selectCls} value={state} onChange={e => setState(e.target.value as AustralianState)}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Vehicle">
        <div className="flex flex-col gap-3">
          <InputField label="Vehicle purchase price (drive-away)" hint="Total drive-away price including GST, LCT and stamp duty">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                value={vehicleCost}
                onChange={e => setVehicleCost(e.target.value)}
                min="0"
               
                required
              />
            </div>
          </InputField>

          <InputField label="Vehicle type">
            <select className={selectCls} value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)}>
              <option value="BEV">Battery Electric Vehicle (BEV)</option>
              <option value="PHEV">Plug-in Hybrid (PHEV)</option>
              <option value="ICE">Petrol / Diesel / Standard Hybrid (ICE)</option>
            </select>
          </InputField>

          {vehicleType === 'PHEV' && (
            <InputField
              label="PHEV delivery date"
              hint="PHEVs are only FBT-exempt if first held and used before 1 April 2025"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={phevBefore}
                  onChange={e => setPhevBefore(e.target.checked)}
                  className="rounded"
                />
                Delivered before 1 April 2025
              </label>
            </InputField>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Lease Terms">
        <div className="flex flex-col gap-3">
          <InputField label="Interest rate">
            <div className="relative">
              <input
                type="number"
                className={inputCls + ' pr-8'}
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                min="0"
                max="30"
                step="any"
                required
              />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
            </div>
          </InputField>

          <InputField label="Lease term">
            <select className={selectCls} value={termYears} onChange={e => setTermYears(e.target.value)}>
              {[1, 2, 3, 4, 5].map(y => (
                <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>
              ))}
            </select>
          </InputField>

          <InputField
            label="Residual value"
            hint={`ATO minimum for ${termYears}-year lease: ${(atoResidual * 100).toFixed(2)}%`}
          >
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useCustomResidual}
                  onChange={e => setUseCustomResidual(e.target.checked)}
                  className="rounded"
                />
                Use custom residual %
              </label>
              {useCustomResidual && (
                <div className="relative flex-1">
                  <input
                    type="number"
                    className={inputCls + ' pr-8'}
                    value={customResidual}
                    onChange={e => setCustomResidual(e.target.value)}
                    placeholder={((atoResidual * 100).toFixed(2))}
                    min="0"
                    max="100"
                   
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                </div>
              )}
            </div>
          </InputField>

          <InputField label="Monthly management / admin fee" hint="Charged by the novated lease provider, typically $65–$130/month">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                value={managementFee}
                onChange={e => setManagementFee(e.target.value)}
                min="0"
               
              />
            </div>
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Running Costs">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 self-start bg-gray-100 rounded-lg p-1">
            {(['monthly', 'annual'] as const).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => setRunningCostPeriod(period)}
                className={[
                  'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                  runningCostPeriod === period
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          {[
            { label: 'Fuel / Charging', key: 'fuel', value: fuel, set: setFuel },
            { label: 'Registration', key: 'registration', value: registration, set: setRegistration },
            { label: 'Insurance', key: 'insurance', value: insurance, set: setInsurance },
            { label: 'Tyres', key: 'tyres', value: tyres, set: setTyres },
            { label: 'Maintenance & servicing', key: 'maintenance', value: maintenance, set: setMaintenance },
          ].map(({ label, key, value, set }) => (
            <InputField key={key} label={label}>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  className={inputCls + ' pl-6'}
                  value={value}
                  onChange={e => set(e.target.value)}
                  min="0"
                />
              </div>
            </InputField>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Compare with Regular Financing">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setShowLoanComparison(v => !v)}
              className={[
                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer',
                showLoanComparison ? 'bg-blue-600' : 'bg-gray-300',
              ].join(' ')}
            >
              <span className={[
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                showLoanComparison ? 'translate-x-5' : 'translate-x-1',
              ].join(' ')} />
            </div>
            <span className="text-sm text-gray-700">Compare against a regular car loan</span>
          </label>

          {showLoanComparison && (
            <>
              <p className="text-xs text-gray-500">
                Running costs are assumed to be the same. No management fee applies to the regular loan.
              </p>
              <InputField label="Loan interest rate" hint="Personal / car loan rate">
                <div className="relative">
                  <input
                    type="number"
                    className={inputCls + ' pr-8'}
                    value={loanComparisonRate}
                    onChange={e => setLoanComparisonRate(e.target.value)}
                    min="0"
                    max="30"
                    step="any"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                </div>
              </InputField>

              <InputField label="Balloon / residual" hint="Leave at $0 for a standard fully-amortising loan">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    className={inputCls + ' pl-6'}
                    value={loanComparisonResidual}
                    onChange={e => setLoanComparisonResidual(e.target.value)}
                    min="0"
                  />
                </div>
              </InputField>
            </>
          )}
        </div>
      </SectionCard>

      <button
        type="submit"
        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-3 text-base transition-colors shadow"
      >
        Calculate
      </button>
    </form>
  )
}
