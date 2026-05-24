// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  baseStorage,
  getSavedActiveTab,
  saveActiveTab,
  getPreferences,
  savePreferences,
  getSavedCalculatorInputs,
  saveCalculatorInputs,
  clearAllSavedData,
  exportProfileData,
  importProfileData,
  type SavedCalculatorInputs,
} from './storage'

describe('storage utility', () => {
  beforeEach(() => {
    // Clear localStorage and mock cookies
    localStorage.clear()
    document.cookie = ''
    // Clear cookie mock since document.cookie = '' does not work like a full reset in some envs
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      }
    }
  })

  it('saves and retrieves active tab', () => {
    saveActiveTab('analyser')
    expect(getSavedActiveTab()).toBe('analyser')
  })

  it('saves and retrieves preferences with defaults', () => {
    expect(getPreferences()).toEqual({ autoSave: true })
    savePreferences({ autoSave: false })
    expect(getPreferences()).toEqual({ autoSave: false })
  })

  it('saves and retrieves calculator inputs', () => {
    const inputs: SavedCalculatorInputs = {
      grossSalary: '150000',
      state: 'VIC',
      vehicleCost: '80000',
      vehicleType: 'BEV',
      phevBefore: false,
      leaseStartDate: '2026-05-24',
      grandfatheredLease: true,
      interestRate: '7.5',
      showLoanComparison: true,
      loanComparisonRate: '8.5',
      loanComparisonResidual: '10000',
      useCustomResidual: true,
      customResidual: '35',
      managementFee: '20',
      runningCostPeriod: 'annual',
      fuel: '1000',
      registration: '800',
      insurance: '2000',
      tyres: '600',
      maintenance: '500',
    }

    saveCalculatorInputs(inputs)
    expect(getSavedCalculatorInputs()).toEqual(inputs)
  })

  it('clears all saved data', () => {
    saveActiveTab('termination')
    savePreferences({ autoSave: false })
    clearAllSavedData()

    expect(getSavedActiveTab()).toBeNull()
    expect(getPreferences()).toEqual({ autoSave: true })
  })

  it('exports and imports profile data', () => {
    saveActiveTab('analyser')
    savePreferences({ autoSave: false })

    const exported = exportProfileData()
    expect(exported).toContain('analyser')
    expect(exported).toContain('false')

    // Reset everything
    clearAllSavedData()
    expect(getSavedActiveTab()).toBeNull()

    // Import back
    const success = importProfileData(exported)
    expect(success).toBe(true)
    expect(getSavedActiveTab()).toBe('analyser')
    expect(getPreferences()).toEqual({ autoSave: false })
  })

  it('handles invalid import data gracefully', () => {
    const success = importProfileData('invalid json string')
    expect(success).toBe(false)
  })

  it('falls back to cookies if localStorage throws error', () => {
    const localGetSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const localSetSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    baseStorage.set('lease-calc:test-fallback', 'cookie-value')
    expect(baseStorage.get('lease-calc:test-fallback')).toBe('cookie-value')

    localGetSpy.mockRestore()
    localSetSpy.mockRestore()
  })
})
