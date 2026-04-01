import { useState } from 'react'
import type { EarlyTerminationInputs, VehicleType } from '../../types'
import { InputField } from '../ui/InputField'
import { SectionCard } from '../ui/SectionCard'
import { ATO_RESIDUALS } from '../../lib/constants'
import { atoResidualPercent } from '../../lib/calculations/lease'

interface TerminationFormProps {
  onCalculate: (inputs: EarlyTerminationInputs) => void
}

export function TerminationForm({ onCalculate }: TerminationFormProps) {
  const [vehicleBaseValue, setVehicleBaseValue] = useState('65000')
  const [vehicleType, setVehicleType] = useState<VehicleType>('BEV')
  const [phevBefore, setPhevBefore] = useState(true)
  const [originalTermMonths, setOriginalTermMonths] = useState('60')
  const [monthsElapsed, setMonthsElapsed] = useState('24')
  const [interestRate, setInterestRate] = useState('7.5')
  const [useCustomResidual, setUseCustomResidual] = useState(false)
  const [customResidualPct, setCustomResidualPct] = useState('')
  const [monthlyPaymentInput, setMonthlyPaymentInput] = useState('')
  const [monthlyManagementFee, setMonthlyManagementFee] = useState('')
  const [terminationFeeInput, setTerminationFeeInput] = useState('')
  const [currentMarketValue, setCurrentMarketValue] = useState('')
  const [terminationDate, setTerminationDate] = useState(
    () => new Date().toISOString().split('T')[0],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const termMonths = parseInt(originalTermMonths) || 60
  const termYears = Math.max(1, Math.min(5, Math.round(termMonths / 12)))
  const atoResidualPct = ATO_RESIDUALS[termYears] ?? ATO_RESIDUALS[5]!
  const baseValue = parseFloat(vehicleBaseValue) || 0
  const defaultResidual = baseValue * atoResidualPct

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    const elapsed = parseInt(monthsElapsed) || 0
    const term = parseInt(originalTermMonths) || 0

    if (elapsed > term) {
      newErrors.monthsElapsed = 'Months elapsed cannot exceed the original lease term.'
    }
    if (useCustomResidual && customResidualPct) {
      const pct = parseFloat(customResidualPct)
      if (pct > 100) newErrors.customResidualPct = 'Residual cannot exceed 100%.'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const residualPercent = useCustomResidual && customResidualPct
      ? parseFloat(customResidualPct) / 100
      : atoResidualPercent(termYears)

    onCalculate({
      vehicleBaseValue: baseValue,
      annualInterestRate: parseFloat(interestRate) / 100 || 0,
      originalTermMonths: term,
      monthsElapsed: elapsed,
      residualValue: baseValue * residualPercent,
      monthlyLeasePayment: monthlyPaymentInput ? parseFloat(monthlyPaymentInput) : null,
      monthlyManagementFee: parseFloat(monthlyManagementFee) || 0,
      terminationFee: parseFloat(terminationFeeInput) || 0,
      currentMarketValue: currentMarketValue ? parseFloat(currentMarketValue) : null,
      vehicleType,
      phevDeliveredBeforeApril2025: phevBefore,
      terminationDate: new Date(terminationDate),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        Calculate what it costs to exit a novated lease early — whether due to redundancy, change of employer,
        or personal choice. Enter your lease details to see the finance payout, vehicle equity position,
        and any FBT owing for the period the vehicle was used.
      </div>

      <SectionCard title="Your Vehicle">
        <div className="flex flex-col gap-3">
          <InputField label="Vehicle base value" hint="Original financed amount (excluding LCT and stamp duty)">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                value={vehicleBaseValue}
                onChange={e => setVehicleBaseValue(e.target.value)}
                min="0"
                required
              />
            </div>
          </InputField>

          <InputField label="Vehicle type">
            <div className="flex gap-2">
              {(['BEV', 'PHEV', 'ICE'] as VehicleType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicleType(type)}
                  className={[
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    vehicleType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
                  ].join(' ')}
                >
                  {type}
                </button>
              ))}
            </div>
          </InputField>

          {vehicleType === 'PHEV' && (
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={phevBefore}
                onChange={e => setPhevBefore(e.target.checked)}
              />
              <span>Vehicle was delivered before 1 April 2025 (FBT exemption eligibility)</span>
            </label>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Lease Terms">
        <div className="flex flex-col gap-3">
          <InputField label="Original lease term" hint="Total term agreed when the lease started">
            <div className="relative">
              <input
                type="number"
                className={inputCls + ' pr-16'}
                value={originalTermMonths}
                onChange={e => setOriginalTermMonths(e.target.value)}
                min="1"
                max="60"
                required
              />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">months</span>
            </div>
          </InputField>

          <InputField
            label="Months elapsed"
            hint="How many months of the lease have already passed"
            error={errors.monthsElapsed}
          >
            <div className="relative">
              <input
                type="number"
                className={inputCls + ' pr-16'}
                value={monthsElapsed}
                onChange={e => setMonthsElapsed(e.target.value)}
                min="0"
                required
              />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">months</span>
            </div>
          </InputField>

          <InputField label="Interest rate" hint="Annual interest rate on the lease finance">
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

          <InputField
            label="Residual value"
            hint={`ATO minimum for ${termYears}-year term: ${(atoResidualPct * 100).toFixed(2)}% = ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(defaultResidual)}`}
            error={errors.customResidualPct}
          >
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomResidual}
                  onChange={e => setUseCustomResidual(e.target.checked)}
                />
                Use a custom residual percentage
              </label>
              {useCustomResidual && (
                <div className="relative">
                  <input
                    type="number"
                    className={inputCls + ' pr-8'}
                    placeholder={(atoResidualPct * 100).toFixed(2)}
                    value={customResidualPct}
                    onChange={e => setCustomResidualPct(e.target.value)}
                    min="0"
                    max="100"
                    step="any"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                </div>
              )}
            </div>
          </InputField>
        </div>
      </SectionCard>

      <SectionCard title="Optional Details">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            These fields are optional. Leave blank to use derived values or skip those calculations.
          </p>

          <InputField
            label="Monthly lease payment"
            hint="Your actual monthly finance repayment — leave blank to derive from lease terms above"
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                placeholder="Derived automatically"
                value={monthlyPaymentInput}
                onChange={e => setMonthlyPaymentInput(e.target.value)}
                min="0"
              />
            </div>
          </InputField>

          <InputField
            label="Monthly management fee"
            hint="Provider admin fee per month — charged for all remaining months on early exit"
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                placeholder="0"
                value={monthlyManagementFee}
                onChange={e => setMonthlyManagementFee(e.target.value)}
                min="0"
              />
            </div>
          </InputField>

          <InputField
            label="Early termination fee"
            hint="Flat exit fee charged by your provider — check your lease agreement"
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                placeholder="0"
                value={terminationFeeInput}
                onChange={e => setTerminationFeeInput(e.target.value)}
                min="0"
              />
            </div>
          </InputField>

          <InputField
            label="Current market value"
            hint="Estimated resale value of the vehicle today — leave blank to skip the equity calculation"
          >
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                className={inputCls + ' pl-6'}
                placeholder="Optional"
                value={currentMarketValue}
                onChange={e => setCurrentMarketValue(e.target.value)}
                min="0"
              />
            </div>
          </InputField>

          <InputField
            label="Termination date"
            hint="Date the lease will be terminated — used for FBT partial-year calculation"
          >
            <input
              type="date"
              className={inputCls}
              value={terminationDate}
              onChange={e => setTerminationDate(e.target.value)}
              required
            />
          </InputField>
        </div>
      </SectionCard>

      <button
        type="submit"
        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-3 text-base transition-colors shadow"
      >
        Calculate Early Termination Cost
      </button>
    </form>
  )
}
