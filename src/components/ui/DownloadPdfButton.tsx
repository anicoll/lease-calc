import { useState } from 'react'
import { downloadPdf } from '../../lib/pdf/downloadPdf'

interface Props {
  elementId: string
  filename: string
  label?: string
}

export function DownloadPdfButton({ elementId, filename, label = 'Download PDF' }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleClick() {
    setIsGenerating(true)
    try {
      await downloadPdf(elementId, filename)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      data-pdf-hide
      className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
    >
      {isGenerating ? 'Generating PDF…' : `⬇ ${label}`}
    </button>
  )
}
