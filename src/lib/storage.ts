import type { AustralianState, VehicleType } from '../types'

export interface SavedCalculatorInputs {
  grossSalary: string
  vehicleCost: string
  vehicleType: VehicleType
  phevBefore: boolean
  leaseStartDate: string
  grandfatheredLease: boolean
  interestRate: string
  showLoanComparison: boolean
  loanComparisonRate: string
  loanComparisonResidual: string
  useCustomResidual: boolean
  customResidual: string
  managementFee: string
  state: AustralianState
  runningCostPeriod: 'monthly' | 'annual'
  fuel: string
  registration: string
  insurance: string
  tyres: string
  maintenance: string
}

export interface SavedAnalyserInputs {
  vehicleBaseValue: string
  termRemainingMonths: string
  payPeriod: 'fortnightly' | 'monthly'
  preTax: string
  managementFee: string
  runningCosts: string
  benchmarkRate: string
}

export interface SavedTerminationInputs {
  vehicleBaseValue: string
  vehicleType: VehicleType
  phevBefore: boolean
  grandfatheredLease: boolean
  originalTermMonths: string
  monthsElapsed: string
  interestRate: string
  useCustomResidual: boolean
  customResidualPct: string
  monthlyPaymentInput: string
  monthlyManagementFee: string
  terminationFeeInput: string
  currentMarketValue: string
  terminationDate: string
}

export interface UserPreferences {
  autoSave: boolean
}

export interface ExportedProfile {
  activeTab?: string | null
  preferences?: UserPreferences
  calculatorInputs?: SavedCalculatorInputs | null
  analyserInputs?: SavedAnalyserInputs | null
  terminationInputs?: SavedTerminationInputs | null
}

const isBrowser = typeof window !== 'undefined'

export const baseStorage = {
  get(key: string): string | null {
    if (!isBrowser) return null
    try {
      const local = localStorage.getItem(key)
      if (local !== null) return local
    } catch (e) {
      // localStorage is blocked or not available
    }
    // Fallback to cookie
    try {
      const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
      return match ? decodeURIComponent(match[2]) : null
    } catch (e) {
      return null
    }
  },

  set(key: string, value: string): void {
    if (!isBrowser) return
    try {
      localStorage.setItem(key, value)
    } catch (e) {}
    try {
      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)
      document.cookie = `${key}=${encodeURIComponent(value)};path=/;expires=${expires.toUTCString()};SameSite=Lax`
    } catch (e) {}
  },

  remove(key: string): void {
    if (!isBrowser) return
    try {
      localStorage.removeItem(key)
    } catch (e) {}
    try {
      document.cookie = `${key}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch (e) {}
  }
}

export function getSavedActiveTab(): string | null {
  return baseStorage.get('lease-calc:active-tab')
}

export function saveActiveTab(tab: string): void {
  baseStorage.set('lease-calc:active-tab', tab)
}

export function getPreferences(): UserPreferences {
  const data = baseStorage.get('lease-calc:preferences')
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {}
  }
  return { autoSave: true }
}

export function savePreferences(prefs: UserPreferences): void {
  baseStorage.set('lease-calc:preferences', JSON.stringify(prefs))
}

export function getSavedCalculatorInputs(): SavedCalculatorInputs | null {
  const data = baseStorage.get('lease-calc:calculator-inputs')
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {}
  }
  return null
}

export function saveCalculatorInputs(inputs: SavedCalculatorInputs): void {
  baseStorage.set('lease-calc:calculator-inputs', JSON.stringify(inputs))
}

export function getSavedAnalyserInputs(): SavedAnalyserInputs | null {
  const data = baseStorage.get('lease-calc:analyser-inputs')
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {}
  }
  return null
}

export function saveAnalyserInputs(inputs: SavedAnalyserInputs): void {
  baseStorage.set('lease-calc:analyser-inputs', JSON.stringify(inputs))
}

export function getSavedTerminationInputs(): SavedTerminationInputs | null {
  const data = baseStorage.get('lease-calc:termination-inputs')
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {}
  }
  return null
}

export function saveTerminationInputs(inputs: SavedTerminationInputs): void {
  baseStorage.set('lease-calc:termination-inputs', JSON.stringify(inputs))
}

export function clearAllSavedData(): void {
  baseStorage.remove('lease-calc:active-tab')
  baseStorage.remove('lease-calc:preferences')
  baseStorage.remove('lease-calc:calculator-inputs')
  baseStorage.remove('lease-calc:analyser-inputs')
  baseStorage.remove('lease-calc:termination-inputs')
}

export function exportProfileData(): string {
  const data: ExportedProfile = {
    activeTab: getSavedActiveTab(),
    preferences: getPreferences(),
    calculatorInputs: getSavedCalculatorInputs(),
    analyserInputs: getSavedAnalyserInputs(),
    terminationInputs: getSavedTerminationInputs(),
  }
  return JSON.stringify(data, null, 2)
}

export function importProfileData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr) as ExportedProfile
    if (!data || typeof data !== 'object') return false

    if (data.activeTab !== undefined) {
      if (data.activeTab) {
        saveActiveTab(data.activeTab)
      } else {
        baseStorage.remove('lease-calc:active-tab')
      }
    }
    if (data.preferences) {
      savePreferences(data.preferences)
    }
    if (data.calculatorInputs) {
      saveCalculatorInputs(data.calculatorInputs)
    }
    if (data.analyserInputs) {
      saveAnalyserInputs(data.analyserInputs)
    }
    if (data.terminationInputs) {
      saveTerminationInputs(data.terminationInputs)
    }
    return true
  } catch (e) {
    return false
  }
}
