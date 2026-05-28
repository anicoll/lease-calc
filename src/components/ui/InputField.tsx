interface InputFieldProps {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}

export function InputField({ label, hint, error, children }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>}
    </div>
  )
}
