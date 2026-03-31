interface InputFieldProps {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}

export function InputField({ label, hint, error, children }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
