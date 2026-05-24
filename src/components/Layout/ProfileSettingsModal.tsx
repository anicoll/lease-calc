import { useEffect, useRef, useState } from 'react'
import {
  getPreferences,
  savePreferences,
  getSavedCalculatorInputs,
  clearAllSavedData,
  exportProfileData,
  importProfileData
} from '../../lib/storage'

interface ProfileSettingsModalProps {
  onClose: () => void
  onReset: () => void
}

export function ProfileSettingsModal({ onClose, onReset }: ProfileSettingsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [autoSave, setAutoSave] = useState(() => getPreferences().autoSave)
  const [calculatorInputs, setCalculatorInputs] = useState(() => getSavedCalculatorInputs())
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Clear message after 4 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  function handleToggleAutoSave() {
    const nextVal = !autoSave
    setAutoSave(nextVal)
    savePreferences({ autoSave: nextVal })
    setMessage({ text: `Auto-save ${nextVal ? 'enabled' : 'disabled'}.`, type: 'success' })
  }

  function handleClear() {
    if (confirm('Are you sure you want to clear all your saved profile settings? This will reset all calculator forms to their system defaults.')) {
      clearAllSavedData()
      setCalculatorInputs(null)
      onReset()
      setMessage({ text: 'All saved data cleared successfully.', type: 'success' })
    }
  }

  function handleExport() {
    try {
      const dataStr = exportProfileData()
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = 'lease-calc-profile.json'

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
      setMessage({ text: 'Profile exported successfully.', type: 'success' })
    } catch (e) {
      setMessage({ text: 'Failed to export profile.', type: 'error' })
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const fileReader = new FileReader()
    const files = e.target.files
    if (!files || files.length === 0) return

    fileReader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        const success = importProfileData(result)
        if (success) {
          setCalculatorInputs(getSavedCalculatorInputs())
          onReset()
          setMessage({ text: 'Profile imported successfully!', type: 'success' })
        } else {
          setMessage({ text: 'Invalid profile file. Please upload a valid JSON profile.', type: 'error' })
        }
      }
    }
    fileReader.readAsText(files[0])
    e.target.value = ''
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Profile &amp; Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close settings"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Your inputs are stored locally in your browser. This custom profile will automatically pre-populate form fields when you return.
          </p>

          {/* Alert Messages */}
          {message && (
            <div
              className={[
                'px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-2',
                message.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800',
              ].join(' ')}
            >
              {message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Profile Overview */}
          {calculatorInputs ? (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Saved Profile Summary</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mt-1">
                <div className="text-gray-500">Gross Salary:</div>
                <div className="font-medium text-gray-900 text-right">${parseFloat(calculatorInputs.grossSalary).toLocaleString()}</div>
                <div className="text-gray-500">State:</div>
                <div className="font-medium text-gray-900 text-right">{calculatorInputs.state}</div>
                <div className="text-gray-500">Vehicle Cost:</div>
                <div className="font-medium text-gray-900 text-right">${parseFloat(calculatorInputs.vehicleCost).toLocaleString()}</div>
                <div className="text-gray-500">Vehicle Type:</div>
                <div className="font-medium text-gray-900 text-right">{calculatorInputs.vehicleType}</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-6 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>No profile values saved yet. Make changes to the calculator inputs to create your profile.</span>
            </div>
          )}

          {/* Preferences */}
          <div className="flex items-center justify-between py-3 border-t border-b border-gray-100 mt-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">Auto-save data</div>
              <div className="text-xs text-gray-400">Automatically save your inputs as you edit them</div>
            </div>
            <button
              onClick={handleToggleAutoSave}
              className={[
                'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer focus:outline-none',
                autoSave ? 'bg-blue-600' : 'bg-gray-200',
              ].join(' ')}
              role="switch"
              aria-checked={autoSave}
            >
              <span
                className={[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  autoSave ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manage Profile Data</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors shadow-sm focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Profile
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors shadow-sm focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Profile
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>
            <button
              onClick={handleClear}
              className="w-full mt-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 rounded-xl text-sm font-medium transition-colors shadow-sm focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset &amp; Clear Stored Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
