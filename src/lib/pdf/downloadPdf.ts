import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const SCALE = 2

/**
 * Returns canvas y-coordinates (in pixels) for each [data-pdf-section] element
 * within the container, representing safe page-break positions.
 */
function getSectionBreaksPx(container: HTMLElement): number[] {
  const containerTop = container.getBoundingClientRect().top
  return Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-section]'))
    .map(el => Math.round((el.getBoundingClientRect().top - containerTop) * SCALE))
    .filter(y => y > 0)
    .sort((a, b) => a - b)
}

/**
 * Given the current top of the page (yPx) and the ideal bottom of the page
 * (yPx + idealPageHeightPx), return the best break point that lands on a
 * section boundary. Falls back to idealPageHeightPx if no boundary fits.
 */
function findBreakPoint(
  currentYPx: number,
  idealPageHeightPx: number,
  canvasHeight: number,
  sectionBreaksPx: number[]
): number {
  const idealBreak = currentYPx + idealPageHeightPx
  if (idealBreak >= canvasHeight) return canvasHeight

  // Last section boundary that starts within this page's content area
  const candidates = sectionBreaksPx.filter(y => y > currentYPx && y <= idealBreak)
  if (candidates.length > 0) return candidates[candidates.length - 1]

  // No section boundary fits — accept the next one beyond the ideal to avoid
  // a mid-section break on a very tall section
  const next = sectionBreaksPx.find(y => y > idealBreak)
  if (next !== undefined) return next

  return idealBreak
}

export async function downloadPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  // Collect section break positions from the live DOM before capture
  const sectionBreaksPx = getSectionBreaksPx(element)

  // Hide any elements marked data-pdf-hide before capture
  const hidden = element.querySelectorAll<HTMLElement>('[data-pdf-hide]')
  hidden.forEach(el => { el.style.visibility = 'hidden' })

  try {
    const canvas = await html2canvas(element, { scale: SCALE, useCORS: true, logging: false })

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidthMm = pdf.internal.pageSize.getWidth()
    const pageHeightMm = pdf.internal.pageSize.getHeight()
    const marginMm = 10
    const contentWidthMm = pageWidthMm - marginMm * 2
    const contentHeightMm = pageHeightMm - marginMm * 2

    const pxPerMm = canvas.width / contentWidthMm
    const idealPageHeightPx = Math.round(contentHeightMm * pxPerMm)

    let yPx = 0
    while (yPx < canvas.height) {
      if (yPx > 0) pdf.addPage()

      const breakY = findBreakPoint(yPx, idealPageHeightPx, canvas.height, sectionBreaksPx)
      const sliceHeightPx = breakY - yPx

      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = sliceHeightPx
      slice.getContext('2d')!.drawImage(canvas, 0, -yPx)

      const sliceHeightMm = (sliceHeightPx / canvas.width) * contentWidthMm
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', marginMm, marginMm, contentWidthMm, sliceHeightMm)

      yPx = breakY
    }

    pdf.save(filename)
  } finally {
    hidden.forEach(el => { el.style.visibility = '' })
  }
}
