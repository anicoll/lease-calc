import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
}

export function Tooltip({ content }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 transition-colors leading-none focus:outline-none flex items-center justify-center"
        aria-label="More information"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path>
        </svg>
      </button>
      {open && (
        <span className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-64 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs px-3 py-2.5 shadow-xl leading-relaxed dark:bg-slate-950 dark:border-slate-800">
          {content}
        </span>
      )}
    </span>
  )
}
