# PDF Download Feature — Implementation Plan

## Status: Ready to implement
> Blocked during initial attempt by corporate Artifactory missing `electron-to-chromium@1.5.330`.
> Fix the npm registry / Artifactory access, then follow the steps below.

---

## Context

The lease calculator is a **pure client-side Vite + React static app** (no backend server). Users want a "Download PDF" button on each of the three result views to save/share their results.

The PDF must be visually consistent with the website (color-coded banners, section cards, green/red result rows, etc.).

---

## Approach: `html2canvas` + `jsPDF`

No WASM, no server, no build-time processing. Both libraries are pure browser JS.

| Approach | Verdict | Reason |
|---|---|---|
| Server-side (Puppeteer) | ✗ | No backend |
| WASM | ✗ | Overkill, poor support |
| `@react-pdf/renderer` | ✗ | Must re-implement all 3 UIs in a PDF DSL |
| `window.print()` + CSS | Possible | Shows browser dialog, can't set filename |
| **`html2canvas` + `jsPDF`** | ✓ **Chosen** | Screenshots live DOM — visual fidelity is automatic |

---

## What Each PDF Contains

| Tab | Component | Sections captured |
|---|---|---|
| Calculator | `src/components/Calculator/ResultsPanel.tsx` | FBT banner, Payment Summary, Annual Breakdown, Tax Details, Lease Details, optional Loan Comparison, optional LCT/Stamp Duty |
| Analyser | `src/components/LeaseAnalyser/AnalyserResults.tsx` | Summary banner, Interest Rate Analysis, Payment Breakdown, Fees, Lease Structure, disclaimer |
| Termination | `src/components/EarlyTermination/TerminationResults.tsx` | Summary banner, Finance Payout, Vehicle Equity, FBT Exposure, ECM note, Summary, disclaimer |

A small branded header (app title + tab name + generation date) is added above the captured content.

---

## Step-by-Step Implementation

### Step 1 — Install dependencies

```bash
npm install html2canvas jspdf
```

### Step 2 — Create `src/lib/pdf/downloadPdf.ts`

New file. Single async utility:

```ts
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function downloadPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  // Hide any elements marked data-pdf-hide before capture
  const hidden = element.querySelectorAll<HTMLElement>('[data-pdf-hide]')
  hidden.forEach(el => { el.style.visibility = 'hidden' })

  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
    const imgData = canvas.toDataURL('image/png')

    const pageWidthMm = 210   // A4
    const marginMm = 10
    const contentWidthMm = pageWidthMm - marginMm * 2
    const contentHeightMm = (canvas.height / canvas.width) * contentWidthMm

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageHeightMm = pdf.internal.pageSize.getHeight() - marginMm * 2

    // Paginate if content is taller than one A4 page
    let yOffset = 0
    while (yOffset < contentHeightMm) {
      if (yOffset > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', marginMm, marginMm - yOffset, contentWidthMm, contentHeightMm)
      yOffset += pageHeightMm
    }

    pdf.save(filename)
  } finally {
    hidden.forEach(el => { el.style.visibility = '' })
  }
}
```

### Step 3 — Create `src/components/ui/DownloadPdfButton.tsx`

New reusable button component:

```tsx
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
      data-pdf-hide                // hidden during PDF capture
      className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
    >
      {isGenerating ? 'Generating PDF…' : `⬇ ${label}`}
    </button>
  )
}
```

### Step 4 — Update the three results components

In each file: add an `id` to the root div, add `data-pdf-hide` to the button so it is hidden during capture, and place `<DownloadPdfButton>` at the bottom.

**`src/components/Calculator/ResultsPanel.tsx`**
- Root div: `<div id="pdf-calculator-results" ...>`
- Add at the bottom (before closing div):
  ```tsx
  <DownloadPdfButton elementId="pdf-calculator-results" filename="novated-lease-calculator.pdf" />
  ```

**`src/components/LeaseAnalyser/AnalyserResults.tsx`**
- Root div: `<div id="pdf-analyser-results" ...>`
- Add at the bottom:
  ```tsx
  <DownloadPdfButton elementId="pdf-analyser-results" filename="lease-analyser.pdf" />
  ```

**`src/components/EarlyTermination/TerminationResults.tsx`**
- Root div: `<div id="pdf-termination-results" ...>`
- Add at the bottom:
  ```tsx
  <DownloadPdfButton elementId="pdf-termination-results" filename="early-termination.pdf" />
  ```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `package.json` | `npm install html2canvas jspdf` adds entries here |
| `src/lib/pdf/downloadPdf.ts` | **New** — core PDF generation utility |
| `src/components/ui/DownloadPdfButton.tsx` | **New** — reusable button with loading state |
| `src/components/Calculator/ResultsPanel.tsx` | Add `id`, import + place button |
| `src/components/LeaseAnalyser/AnalyserResults.tsx` | Add `id`, import + place button |
| `src/components/EarlyTermination/TerminationResults.tsx` | Add `id`, import + place button |

---

## Testing

### Verification checklist
1. `npm run dev` → fill in values in each tab → click "Download PDF"
2. PDF opens with visual output matching the on-screen results panel
3. Button does not appear in the PDF
4. Long panels (Calculator with loan comparison enabled) paginate correctly across A4 pages
5. `npm run build` — no TypeScript errors
6. `npm test` — all existing Vitest tests continue to pass

### Unit tests — `src/lib/pdf/downloadPdf.test.ts`

Mock `html2canvas` and `jsPDF` in Vitest to avoid browser dependencies:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSave = vi.fn()
const mockAddImage = vi.fn()
const mockAddPage = vi.fn()
const mockCanvas = {
  toDataURL: vi.fn(() => 'data:image/png;base64,abc'),
  width: 800,
  height: 2000,
}

vi.mock('html2canvas', () => ({ default: vi.fn().mockResolvedValue(mockCanvas) }))
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    addImage: mockAddImage,
    addPage: mockAddPage,
    save: mockSave,
    internal: { pageSize: { getHeight: () => 297 } },
  })),
}))
```

Tests to write:
- Calls `html2canvas` with `{ scale: 2 }` on the correct element
- Calls `pdf.save()` with the supplied filename
- Elements with `data-pdf-hide` have `visibility: hidden` during capture and are restored after
- Throws when `elementId` is not found in the DOM
- Calls `pdf.addPage()` when content height exceeds one A4 page

### Visual golden file tests — Playwright (separate setup)

Since the PDF is a screenshot of the results panel, visual regression tests on the panel itself prove the PDF content.

```bash
npm install -D @playwright/test
npx playwright install chromium
```

New files:
- `playwright.config.ts` — points at `http://localhost:5173`, sets snapshot directory
- `tests/calculator.spec.ts` — fills form with fixed values, screenshots `#pdf-calculator-results`
- `tests/analyser.spec.ts` — same for analyser
- `tests/termination.spec.ts` — same for termination

Workflow:
- First run: `npx playwright test --update-snapshots` → stores golden PNGs in `tests/screenshots/`
- Commit the golden PNGs to git
- Subsequent runs diff live output against golden — failures require explicit `--update-snapshots` to approve
