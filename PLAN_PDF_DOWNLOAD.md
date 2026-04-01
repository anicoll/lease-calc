# PDF Download Feature — Implementation Plan

## Status: Core implementation complete — Playwright visual tests remaining

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

---

## Files Created / Modified

| File | Action | Notes |
|---|---|---|
| `src/lib/pdf/downloadPdf.ts` | **New** — core PDF generation utility | See design notes below |
| `src/lib/pdf/downloadPdf.test.ts` | **New** — Vitest unit tests | jsdom environment, canvas stubbed |
| `src/components/ui/DownloadPdfButton.tsx` | **New** — reusable button with loading state | Hidden during capture via `data-pdf-hide` |
| `src/components/ui/SectionCard.tsx` | Modified — added `data-pdf-section` | Enables smart page breaking |
| `src/components/Calculator/ResultsPanel.tsx` | Modified | Added `id="pdf-calculator-results"`, `<DownloadPdfButton>` |
| `src/components/LeaseAnalyser/AnalyserResults.tsx` | Modified | Added `id="pdf-analyser-results"`, `<DownloadPdfButton>` |
| `src/components/EarlyTermination/TerminationResults.tsx` | Modified | Added `id="pdf-termination-results"`, `<DownloadPdfButton>` |

---

## How `downloadPdf` Works

### Overview

```
element (DOM) ──► html2canvas ──► canvas
                                    │
                            slice at section boundaries
                                    │
                              jsPDF page(s)
                                    │
                                 .save()
```

### Step 1 — Collect section break positions

Before html2canvas runs, `getSectionBreaksPx()` queries all `[data-pdf-section]` elements inside the container and records their `y` position in canvas pixels (CSS px × scale 2). Every `SectionCard` has this attribute.

This gives a list of "safe" break points — the whitespace gaps between cards.

### Step 2 — Capture the canvas

`html2canvas(element, { scale: 2 })` renders the full results panel into an off-screen canvas at 2× resolution.

`data-pdf-hide` elements (the Download button itself) have `visibility: hidden` applied before capture and are restored in a `finally` block.

### Step 3 — Paginate with smart breaks

`findBreakPoint()` is called for each page:

1. Compute the **ideal break** = current top + one page's worth of pixels.
2. Look for the **last section boundary** that fits within that page height.
3. If one exists → break there (always lands in the gap between cards, never mid-row).
4. If no boundary fits (a single section is taller than a page) → snap to the **next** section boundary after the ideal, extending this page slightly rather than cutting inside a card.
5. If no further boundaries exist → break at the ideal position (last resort).

### Step 4 — Slice and place

For each page, a new `<canvas>` is created of exactly the slice height, populated with `drawImage(fullCanvas, 0, -yPx)`. The slice is encoded as PNG and placed at `(marginMm, marginMm)` on the PDF page.

Margins are 10 mm on all sides. Each slice occupies only its unique pixels — no content is shared between pages.

### Why not the original fixed-offset approach?

The plan originally described placing the full canvas image at `y = marginMm - yOffset` on each page (shifting it up). This caused a `marginMm` (10 mm) overlap: the top margin of each subsequent page rendered the same pixels as the bottom of the previous page. Switching to canvas slicing eliminated the overlap. Smart section-boundary breaks then eliminated mid-row cuts.

---

## `DownloadPdfButton` Component

```
<DownloadPdfButton
  elementId="pdf-calculator-results"   ← the root div's id
  filename="novated-lease-calculator.pdf"
  label="Download PDF"                  ← optional, default shown
/>
```

- Shows a spinner ("Generating PDF…") while `html2canvas` is running.
- Carries `data-pdf-hide` so it is invisible in the captured canvas.
- Disabled while generating (prevents double-clicks).

---

## Remaining: Playwright Visual Regression Tests

The unit tests (`src/lib/pdf/downloadPdf.test.ts`) cover the pagination logic in isolation. Visual golden-file tests are not yet set up.

### Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### New files needed

- `playwright.config.ts` — points at `http://localhost:5173`, sets snapshot directory
- `tests/calculator.spec.ts` — fills form with fixed values, screenshots `#pdf-calculator-results`
- `tests/analyser.spec.ts` — same for analyser
- `tests/termination.spec.ts` — same for termination

### Workflow

- First run: `npx playwright test --update-snapshots` → stores golden PNGs in `tests/screenshots/`
- Commit the golden PNGs to git
- Subsequent runs diff live output against golden — failures require explicit `--update-snapshots` to approve

### Verification checklist (manual)

1. `npm run dev` → fill in values in each tab → click "Download PDF"
2. PDF opens with visual output matching the on-screen results panel
3. Button does not appear in the PDF
4. Long panels (Calculator with loan comparison enabled) paginate between section cards, not mid-row
5. `npm run build` — no TypeScript errors
6. `npm test` — all existing Vitest tests continue to pass
