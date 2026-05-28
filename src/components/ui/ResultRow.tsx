import { Tooltip } from './Tooltip'

interface ResultRowProps {
  label: string
  value: string
  highlight?: boolean
  indent?: boolean
  positive?: boolean
  negative?: boolean
  hint?: string
}

export function ResultRow({ label, value, highlight, indent, positive, negative, hint }: ResultRowProps) {
  return (
    <div
      className={[
        'flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0',
        indent ? 'pl-4' : '',
        highlight ? 'font-bold border-t border-slate-200 dark:border-slate-700 mt-2 pt-3' : '',
      ].join(' ')}
    >
      <span className={['text-sm flex items-center gap-1', indent ? 'text-slate-500 dark:text-slate-400 font-normal' : 'text-slate-700 dark:text-slate-300 font-medium'].join(' ')}>
        {label}
        {hint && <Tooltip content={hint} />}
      </span>
      <span
        className={[
          'text-sm tabular-nums',
          highlight ? 'text-base font-extrabold text-blue-600 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200',
          positive ? 'text-green-600 dark:text-emerald-400 font-semibold' : '',
          negative ? 'text-red-600 dark:text-red-400 font-semibold' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
