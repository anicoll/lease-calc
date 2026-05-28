import { useState, useEffect } from 'react'
import type { AustralianState, MultiTermLeaseInputs, RunningCosts, VehicleType } from '../../types'
import { InputField } from '../ui/InputField'
import { SectionCard } from '../ui/SectionCard'
import { getSavedCalculatorInputs, saveCalculatorInputs, getPreferences } from '../../lib/storage'

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']

interface InputFormProps {
  onCalculate: (inputs: MultiTermLeaseInputs) => void
  onSaveQuote?: (inputs: MultiTermLeaseInputs, label: string, rawInputs: any) => void
}


export function InputForm({ onCalculate, onSaveQuote }: InputFormProps) {
  const saved = getSavedCalculatorInputs()

  // Base state fields
  const [grossSalary, setGrossSalary] = useState(saved?.grossSalary ?? '120000')
  const [vehicleCost, setVehicleCost] = useState(saved?.vehicleCost ?? '65000')
  const [vehicleType, setVehicleType] = useState<VehicleType>(saved?.vehicleType ?? 'BEV')
  const [phevBefore, setPhevBefore] = useState(saved?.phevBefore ?? true)
  const [leaseStartDate, setLeaseStartDate] = useState(
    saved?.leaseStartDate ?? (() => new Date().toISOString().split('T')[0]),
  )
  const [grandfatheredLease, setGrandfatheredLease] = useState(saved?.grandfatheredLease ?? false)
  const [interestRate, setInterestRate] = useState(saved?.interestRate ?? '8.0')
  const [showLoanComparison, setShowLoanComparison] = useState(saved?.showLoanComparison ?? false)
  const [loanComparisonRate, setLoanComparisonRate] = useState(saved?.loanComparisonRate ?? '9.0')
  const [loanComparisonResidual, setLoanComparisonResidual] = useState(saved?.loanComparisonResidual ?? '0')
  const [useCustomResidual, setUseCustomResidual] = useState(saved?.useCustomResidual ?? false)
  const [customResidual, setCustomResidual] = useState(saved?.customResidual ?? '')
  const [managementFee, setManagementFee] = useState(saved?.managementFee ?? '13')
  const [state, setState] = useState<AustralianState>(saved?.state ?? 'SA')

  // Running costs
  const [runningCostPeriod, setRunningCostPeriod] = useState<'monthly' | 'annual'>(saved?.runningCostPeriod ?? 'monthly')
  const [fuel, setFuel] = useState(saved?.fuel ?? '45')
  const [registration, setRegistration] = useState(saved?.registration ?? '70')
  const [insurance, setInsurance] = useState(saved?.insurance ?? '140')
  const [tyres, setTyres] = useState(saved?.tyres ?? '50')
  const [maintenance, setMaintenance] = useState(saved?.maintenance ?? '65')

  // Label for saving quote
  const [quoteLabel, setQuoteLabel] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update quote label based on inputs if not customized
  useEffect(() => {
    const formattedCost = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(parseFloat(vehicleCost) || 0)
    setQuoteLabel(`${vehicleType === 'BEV' ? 'Tesla/EV' : vehicleType === 'PHEV' ? 'PHEV' : 'ICE'} (${formattedCost})`)
  }, [vehicleCost, vehicleType])

  useEffect(() => {
    if (getPreferences().autoSave) {
      saveCalculatorInputs({
        grossSalary,
        vehicleCost,
        vehicleType,
        phevBefore,
        leaseStartDate,
        grandfatheredLease,
        interestRate,
        showLoanComparison,
        loanComparisonRate,
        loanComparisonResidual,
        useCustomResidual,
        customResidual,
        managementFee,
        state,
        runningCostPeriod,
        fuel,
        registration,
        insurance,
        tyres,
        maintenance,
      })
    }
  }, [
    grossSalary,
    vehicleCost,
    vehicleType,
    phevBefore,
    leaseStartDate,
    grandfatheredLease,
    interestRate,
    showLoanComparison,
    loanComparisonRate,
    loanComparisonResidual,
    useCustomResidual,
    customResidual,
    managementFee,
    state,
    runningCostPeriod,
    fuel,
    registration,
    insurance,
    tyres,
    maintenance,
  ])

  function getCalculatedInputs(): MultiTermLeaseInputs | null {
    const salaryVal = parseFloat(grossSalary)
    const vehicleVal = parseFloat(vehicleCost)
    const residualVal = useCustomResidual && customResidual ? parseFloat(customResidual) : null
    const loanResidualVal = showLoanComparison ? parseFloat(loanComparisonResidual) || 0 : 0

    const newErrors: Record<string, string> = {}
    if (!salaryVal || salaryVal <= 0) newErrors.grossSalary = 'Please enter a gross salary greater than $0.'
    if (!vehicleVal || vehicleVal <= 0) newErrors.vehicleCost = 'Please enter a vehicle price greater than $0.'
    if (residualVal !== null && residualVal > 100) newErrors.customResidual = 'Residual cannot exceed 100%.'
    if (showLoanComparison && loanResidualVal >= vehicleVal) newErrors.loanComparisonResidual = 'Balloon cannot be equal to or greater than the vehicle price.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return null
    }

    setErrors({})
    const multiplier = runningCostPeriod === 'monthly' ? 12 : 1
    const runningCosts: RunningCosts = {
      fuel: (parseFloat(fuel) || 0) * multiplier,
      registration: (parseFloat(registration) || 0) * multiplier,
      insurance: (parseFloat(insurance) || 0) * multiplier,
      tyres: (parseFloat(tyres) || 0) * multiplier,
      maintenance: (parseFloat(maintenance) || 0) * multiplier,
    }
    const customResidualPercent = useCustomResidual && customResidual ? parseFloat(customResidual) / 100 : null

    return {
      grossSalary: parseFloat(grossSalary) || 0,
      vehicleCost: parseFloat(vehicleCost) || 0,
      vehicleType,
      phevDeliveredBeforeApril2025: phevBefore,
      leaseStartDate: new Date(leaseStartDate),
      grandfatheredLease,
      interestRate: parseFloat(interestRate) / 100 || 0,
      showLoanComparison,
      loanComparisonRate: showLoanComparison ? (parseFloat(loanComparisonRate) / 100 || 0) : 0,
      loanComparisonResidual: showLoanComparison ? (parseFloat(loanComparisonResidual) || 0) : 0,
      customResidualPercent,
      annualManagementFee: (parseFloat(managementFee) || 0) * 12,
      runningCosts,
      state,
    }
  }


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const inputs = getCalculatedInputs()
    if (inputs) {
      onCalculate(inputs)
    }
  }

  function handleSaveQuote() {
    const inputs = getCalculatedInputs()
    if (inputs && onSaveQuote) {
      onSaveQuote(inputs, quoteLabel.trim() || 'Lease Quote', {
        grossSalary,
        vehicleCost,
        vehicleType,
        phevBefore,
        leaseStartDate,
        grandfatheredLease,
        interestRate,
        showLoanComparison,
        loanComparisonRate,
        loanComparisonResidual,
        useCustomResidual,
        customResidual,
        managementFee,
        state,
        runningCostPeriod,
        fuel,
        registration,
        insurance,
        tyres,
        maintenance,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }


  const inputCls = 'w-full rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-cyan-500'
  const selectCls = inputCls

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <SectionCard title="Your Details">
        <div className="flex flex-col gap-4">
          <InputField label="Annual gross salary" hint="Before tax, in Australian dollars" error={errors.grossSalary}>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
                <input
                  type="number"
                  className={inputCls + ' pl-6'}
                  value={grossSalary}
                  onChange={e => setGrossSalary(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <input
                type="range"
                min="20000"
                max="300000"
                step="5000"
                value={parseFloat(grossSalary) || 20000}
                onChange={e => setGrossSalary(e.target.value)}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$20k</span>
                <span>$160k</span>
                <span>$300k+</span>
              </div>
            </div>
          </InputField>

          <InputField label="State">
            <select className={selectCls} value={state} onChange={e => setState(e.target.value as AustralianState)}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Vehicle Details">
        <div className="flex flex-col gap-4">
          <InputField label="Vehicle purchase price (drive-away)" hint="Total drive-away price including GST, LCT and stamp duty" error={errors.vehicleCost}>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
                <input
                  type="number"
                  className={inputCls + ' pl-6'}
                  value={vehicleCost}
                  onChange={e => setVehicleCost(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <input
                type="range"
                min="10000"
                max="180000"
                step="1000"
                value={parseFloat(vehicleCost) || 10000}
                onChange={e => setVehicleCost(e.target.value)}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>$10k</span>
                <span>$95k</span>
                <span>$180k+</span>
              </div>
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
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={phevBefore}
                  onChange={e => setPhevBefore(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                />
                Delivered before 1 April 2025
              </label>
            </InputField>
          )}

          <InputField
            label="Lease start date"
            hint="Used to determine which FBT phase rules apply to this lease"
          >
            <input
              type="date"
              className={inputCls}
              value={leaseStartDate}
              onChange={e => setLeaseStartDate(e.target.value)}
              required
            />
          </InputField>

          {vehicleType === 'BEV' && (
            <InputField
              label="Grandfathered lease"
              hint="Leases entered into before 1 April 2027 keep full Phase 1 FBT exemption for the entire lease term, regardless of when the lease ends"
            >
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={grandfatheredLease}
                  onChange={e => setGrandfatheredLease(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                />
                Lease entered into before 1 April 2027 (grandfathered)
              </label>
            </InputField>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Lease Terms">
        <div className="flex flex-col gap-4">
          <InputField label="Interest rate" hint="Annual finance lease rate">
            <div className="flex flex-col gap-2">
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
                <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-600 text-sm">%</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="18.0"
                step="0.1"
                value={parseFloat(interestRate) || 3.0}
                onChange={e => setInterestRate(e.target.value)}
                className="w-full mt-1"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3.0%</span>
                <span>10.5%</span>
                <span>18.0%</span>
              </div>
            </div>
          </InputField>

          <InputField
            label="Residual value"
            hint="Leave blank to use ATO minimums (1yr: 65.63%, 2yr: 56.25%, 3yr: 46.88%, 4yr: 37.50%, 5yr: 28.13%). A custom % applies to all terms."
            error={errors.customResidual}
          >
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={useCustomResidual}
                  onChange={e => setUseCustomResidual(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                />
                Use custom residual %
              </label>
              {useCustomResidual && (
                <div className="relative">
                  <input
                    type="number"
                    className={inputCls + ' pr-8'}
                    value={customResidual}
                    onChange={e => setCustomResidual(e.target.value)}
                    placeholder="e.g. 35"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-600 text-sm">%</span>
                </div>
              )}
            </div>
          </InputField>

          <InputField label="Monthly management / admin fee" hint="Charged by the novated lease provider, typically $10–$30/month">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 self-start bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['monthly', 'annual'] as const).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => setRunningCostPeriod(period)}
                className={[
                  'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  runningCostPeriod === period
                    ? 'bg-white text-blue-600 dark:bg-slate-950 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
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
                <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
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
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setShowLoanComparison(v => !v)}
              className={[
                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer',
                showLoanComparison ? 'bg-blue-600 dark:bg-cyan-500' : 'bg-slate-300 dark:bg-slate-800',
              ].join(' ')}
            >
              <span className={[
                'absolute top-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow transition-transform',
                showLoanComparison ? 'translate-x-5' : 'translate-x-1',
              ].join(' ')} />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compare against a regular car loan</span>
          </label>

          {showLoanComparison && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Running costs are assumed to be identical. Balloon values and finance parameters can be customized below.
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
                  <span className="absolute right-3 top-2 text-slate-400 dark:text-slate-600 text-sm">%</span>
                </div>
              </InputField>

              <InputField label="Balloon / residual" hint="Leave at $0 for a standard fully-amortising loan" error={errors.loanComparisonResidual}>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 dark:text-slate-600 text-sm">$</span>
                  <input
                    type="number"
                    className={inputCls + ' pl-6'}
                    value={loanComparisonResidual}
                    onChange={e => setLoanComparisonResidual(e.target.value)}
                    min="0"
                  />
                </div>
              </InputField>
            </div>
          )}
        </div>
      </SectionCard>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-bold rounded-xl py-3.5 text-base transition-colors shadow-md hover:shadow-lg cursor-pointer"
        >
          Calculate Outcomes
        </button>

        {onSaveQuote && (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Quote label (e.g. Model Y)"
              value={quoteLabel}
              onChange={(e) => setQuoteLabel(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleSaveQuote}
              className={[
                'px-4 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer whitespace-nowrap',
                saveSuccess
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-200',
              ].join(' ')}
            >
              {saveSuccess ? 'Saved! ✓' : 'Save to Quotes'}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
