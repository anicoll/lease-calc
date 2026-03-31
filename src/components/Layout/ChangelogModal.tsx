import { useEffect, useRef } from 'react'
import changelogRaw from '../../../CHANGELOG.md?raw'

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      nodes.push(<ul key={key++} className="list-disc list-inside space-y-1 mb-3 text-gray-600 text-sm">{listItems}</ul>)
      listItems = []
    }
  }

  function inlineFormat(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushList()
      nodes.push(<h2 key={key++} className="text-base font-bold text-gray-900 mt-5 mb-1 border-b border-gray-200 pb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      flushList()
      nodes.push(<h3 key={key++} className="text-sm font-semibold text-blue-700 mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('# ')) {
      flushList()
      nodes.push(<h1 key={key++} className="text-lg font-bold text-gray-900 mb-2">{line.slice(2)}</h1>)
    } else if (line.startsWith('- ')) {
      listItems.push(<li key={key++}>{inlineFormat(line.slice(2))}</li>)
    } else if (line.trim() === '') {
      flushList()
    } else {
      flushList()
      nodes.push(<p key={key++} className="text-sm text-gray-600 mb-2">{inlineFormat(line)}</p>)
    }
  }
  flushList()
  return nodes
}

interface Props {
  onClose: () => void
}

export function ChangelogModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">What's new</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close changelog"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {renderMarkdown(changelogRaw)}
        </div>
      </div>
    </div>
  )
}
