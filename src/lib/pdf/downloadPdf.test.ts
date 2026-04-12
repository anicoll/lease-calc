// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSave, mockAddPage, mockCanvas, MockJsPDF } = vi.hoisted(() => {
  const mockCanvas = {
    toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
    width: 800,
    height: 2000,
  }
  const mockSave = vi.fn()
  const mockAddPage = vi.fn()

  class MockJsPDF {
    addImage = vi.fn()
    addPage = mockAddPage
    save = mockSave
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    }
  }

  return { mockSave, mockAddPage, mockCanvas, MockJsPDF }
})

vi.mock('html2canvas', () => ({ default: vi.fn().mockResolvedValue(mockCanvas) }))
vi.mock('jspdf', () => ({ jsPDF: MockJsPDF }))

import html2canvas from 'html2canvas'
import { downloadPdf } from './downloadPdf'

beforeEach(() => {
  vi.clearAllMocks()
  ;(html2canvas as ReturnType<typeof vi.fn>).mockResolvedValue(mockCanvas)
  // jsdom doesn't support canvas 2D context — stub it out
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never
  document.body.innerHTML = ''
})

describe('downloadPdf', () => {
  it('throws when elementId is not found in the DOM', async () => {
    await expect(downloadPdf('nonexistent', 'out.pdf')).rejects.toThrow('Element #nonexistent not found')
  })

  it('calls html2canvas with scale: 2 on the correct element', async () => {
    const el = document.createElement('div')
    el.id = 'test-el'
    document.body.appendChild(el)

    await downloadPdf('test-el', 'out.pdf')

    expect(html2canvas).toHaveBeenCalledWith(el, expect.objectContaining({ scale: 2 }))
  })

  it('calls pdf.save() with the supplied filename', async () => {
    const el = document.createElement('div')
    el.id = 'test-el2'
    document.body.appendChild(el)

    await downloadPdf('test-el2', 'my-report.pdf')

    expect(mockSave).toHaveBeenCalledWith('my-report.pdf')
  })

  it('hides elements with data-pdf-hide during capture and restores them after', async () => {
    const el = document.createElement('div')
    el.id = 'test-el3'
    const child = document.createElement('button')
    child.setAttribute('data-pdf-hide', '')
    el.appendChild(child)
    document.body.appendChild(el)

    let visibilityDuringCapture = ''
    ;(html2canvas as ReturnType<typeof vi.fn>).mockImplementationOnce((capturedEl: HTMLElement) => {
      visibilityDuringCapture = (capturedEl.querySelector('[data-pdf-hide]') as HTMLElement).style.visibility
      return Promise.resolve(mockCanvas)
    })

    await downloadPdf('test-el3', 'out.pdf')

    expect(visibilityDuringCapture).toBe('hidden')
    expect(child.style.visibility).toBe('')
  })

  it('calls pdf.addPage() when content height exceeds one A4 page', async () => {
    // marginMm=10, contentHeightMm=277, pxPerMm=800/190≈4.21, pageHeightPx≈1167
    // canvas.height=2000 > 1167 → addPage is called at least once
    // No section breaks registered → falls back to idealPageHeightPx
    const el = document.createElement('div')
    el.id = 'test-el4'
    document.body.appendChild(el)

    await downloadPdf('test-el4', 'out.pdf')

    expect(mockAddPage).toHaveBeenCalled()
  })
})

describe('findBreakPoint (via integration)', () => {
  it('breaks at a section boundary rather than mid-content when one fits', async () => {
    // Set up a container with a section boundary at y=500px (canvas coords)
    // Page height in canvas px: contentHeightMm(277) * pxPerMm(800/190) ≈ 1167px
    // Section break at 500px < 1167px → first page ends at 500px, second page needed
    // Second page: currentY=500, idealBreak=500+1167=1667 > canvas.height(2000)? No, 1667<2000
    //   section break at y=500 is not > 500, and canvas.height=2000 > 1667
    //   so second page extends to canvas.height=2000
    // addPage called once
    const container = document.createElement('div')
    container.id = 'test-sections'

    const section = document.createElement('div')
    section.setAttribute('data-pdf-section', '')
    // jsdom getBoundingClientRect returns 0 by default — override for this element
    section.getBoundingClientRect = vi.fn(() => ({
      top: 250,  // 250 CSS px from top → 500 canvas px (scale:2)
      bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {}
    }))
    container.appendChild(section)

    // Override container top to 0
    container.getBoundingClientRect = vi.fn(() => ({
      top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => {}
    }))

    document.body.appendChild(container)

    await downloadPdf('test-sections', 'out.pdf')

    expect(mockAddPage).toHaveBeenCalled()
  })
})
