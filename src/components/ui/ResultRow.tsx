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
        'flex items-center justify-between py-2',
        indent ? 'pl-4' : '',
        highlight ? 'font-semibold border-t border-gray-200 mt-1 pt-3' : '',
      ].join(' ')}
    >
      <span className={['text-sm flex items-center', indent ? 'text-gray-600' : 'text-gray-700'].join(' ')}>
        {label}
        {hint && <Tooltip content={hint} />}
      </span>
      <span
        className={[
          'text-sm tabular-nums',
          highlight ? 'text-base font-bold' : '',
          positive ? 'text-green-600' : '',
          negative ? 'text-red-600' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}
