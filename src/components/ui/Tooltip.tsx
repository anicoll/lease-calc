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
        className="text-gray-400 hover:text-blue-500 transition-colors leading-none focus:outline-none"
        aria-label="More information"
      >
        ⓘ
      </button>
      {open && (
        <span className="absolute left-5 top-0 z-10 w-64 rounded-lg bg-gray-800 text-white text-xs px-3 py-2 shadow-lg leading-relaxed">
          {content}
          <span className="absolute -left-1 top-2 w-2 h-2 bg-gray-800 rotate-45" />
        </span>
      )}
    </span>
  )
}
