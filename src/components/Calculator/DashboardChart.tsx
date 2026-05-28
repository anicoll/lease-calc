import { useState, useRef } from 'react'
import type { LeaseResult } from '../../types'

interface DashboardChartProps {
  results: LeaseResult[]
  selectedTerm: number | null
  onSelectTerm: (term: number) => void
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardChart({ results, selectedTerm, onSelectTerm }: DashboardChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Ensure results are sorted by term
  const sortedResults = [...results].sort((a, b) => a.termYears - b.termYears)

  // Chart bounds & scaling configuration
  const width = 600
  const height = 280
  const paddingLeft = 55
  const paddingRight = 35
  const paddingTop = 40
  const paddingBottom = 40

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Metrics to plot:
  // 1. Net Out of Pocket (Monthly)
  // 2. Monthly Tax Savings (Annual savings / 12)
  // 3. Take Home Pay (Monthly Net after sacrifice and ECM)
  const dataPoints = sortedResults.map((r, idx) => ({
    term: r.termYears,
    label: `${r.termYears} Yr`,
    outOfPocket: r.effectiveMonthlyOutOfPocket,
    taxSaving: r.annualTaxSaving / 12,
    takeHome: (r.newTaxableIncome - r.taxAfterSacrifice - r.annualPostTaxDeduction) / 12,
    originalResult: r,
    index: idx
  }))

  if (dataPoints.length === 0) return null

  // Find min/max ranges for Y-axis scaling
  const allYValues = dataPoints.flatMap(d => [d.outOfPocket, d.taxSaving])
  const minY = 0 // Align axis baseline to $0
  const maxY = Math.max(...allYValues) * 1.15 || 1000 // Give 15% breathing room

  // Mapping coordinate functions
  const getX = (index: number) => {
    if (dataPoints.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (dataPoints.length - 1)) * chartWidth
  }

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minY) / (maxY - minY)) * chartHeight
  }

  // Create path strings
  const getPathD = (key: 'outOfPocket' | 'taxSaving') => {
    return dataPoints.reduce((acc, d, idx) => {
      const x = getX(idx)
      const y = getY(d[key])
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
    }, '')
  }

  // Create area paths for fill gradients below the lines
  const getAreaPathD = (key: 'outOfPocket' | 'taxSaving') => {
    if (dataPoints.length === 0) return ''
    const linePath = getPathD(key)
    const firstX = getX(0)
    const lastX = getX(dataPoints.length - 1)
    const baselineY = getY(0)
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`
  }

  const outOfPocketPath = getPathD('outOfPocket')
  const outOfPocketAreaPath = getAreaPathD('outOfPocket')
  const taxSavingPath = getPathD('taxSaving')
  const taxSavingAreaPath = getAreaPathD('taxSaving')

  // Handle pointer hover inside SVG to get closest data point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Convert SVG viewbox coords from screen coords
    const svgX = (x / rect.width) * width

    // Find closest index based on X coordinate
    let closestIdx = 0
    let closestDist = Infinity

    dataPoints.forEach((_, idx) => {
      const dist = Math.abs(getX(idx) - svgX)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = idx
      }
    })


    setHoverIndex(closestIdx)
  }

  const handleMouseLeave = () => {
    setHoverIndex(null)
  }

  const handleClick = () => {
    if (hoverIndex !== null) {
      onSelectTerm(dataPoints[hoverIndex].term)
    }
  }

  const activeIndex = hoverIndex !== null ? hoverIndex : dataPoints.findIndex(d => d.term === selectedTerm)
  const activePoint = activeIndex !== -1 ? dataPoints[activeIndex] : null

  // Generate Y-axis grid ticks (e.g. 4 divisions)
  const yTicksCount = 4
  const yTicks = Array.from({ length: yTicksCount + 1 }).map((_, idx) => {
    const val = minY + (idx / yTicksCount) * (maxY - minY)
    return {
      val,
      y: getY(val)
    }
  })

  return (
    <div className="glass-panel p-5 glow-cyan">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Interactive Lease Term Comparison</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize monthly out-of-pocket costs vs. tax savings across 1–5 year terms.
          </p>
        </div>
        <div className="flex gap-4 text-xs font-semibold self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-cyan-500 dark:bg-cyan-400 block" />
            <span className="text-slate-600 dark:text-slate-400">Out-of-Pocket</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-emerald-500 dark:bg-emerald-400 block" />
            <span className="text-slate-600 dark:text-slate-400">Tax Savings</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair overflow-visible select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Custom Gradients */}
          <defs>
            <linearGradient id="gradient-out-of-pocket" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-tax-saving" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick, idx) => (
            <g key={idx} className="opacity-40 dark:opacity-20">
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-slate-300 dark:text-slate-700"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 fill-current"
              >
                {fmt(tick.val)}
              </text>
            </g>
          ))}

          {/* X Axis labels */}
          {dataPoints.map((d, idx) => (
            <text
              key={idx}
              x={getX(idx)}
              y={height - paddingBottom + 18}
              textAnchor="middle"
              className={[
                'text-[10px] font-bold fill-current transition-colors duration-200',
                d.term === selectedTerm
                  ? 'text-blue-600 dark:text-cyan-400'
                  : 'text-slate-400 dark:text-slate-500'
              ].join(' ')}
            >
              {d.label}
            </text>
          ))}

          {/* Area Gradients */}
          <path d={outOfPocketAreaPath} fill="url(#gradient-out-of-pocket)" />
          <path d={taxSavingAreaPath} fill="url(#gradient-tax-saving)" />

          {/* Trend Lines */}
          <path
            d={outOfPocketPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
          <path
            d={taxSavingPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Hover reference line */}
          {activePoint && (
            <line
              x1={getX(activeIndex)}
              y1={paddingTop - 10}
              x2={getX(activeIndex)}
              y2={height - paddingBottom}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="text-slate-400 dark:text-slate-700 pointer-events-none"
            />
          )}

          {/* Data Points markers */}
          {dataPoints.map((d, idx) => {
            const isSelected = d.term === selectedTerm
            const isActive = idx === activeIndex
            return (
              <g key={idx} className="pointer-events-none">
                {/* Out of pocket dot */}
                <circle
                  cx={getX(idx)}
                  cy={getY(d.outOfPocket)}
                  r={isSelected ? 6 : isActive ? 5 : 4}
                  fill={isSelected || isActive ? '#06b6d4' : '#ffffff'}
                  stroke="#06b6d4"
                  strokeWidth={isSelected || isActive ? 3 : 2}
                  className="dark:fill-slate-950 transition-all duration-200"
                />
                {/* Tax saving dot */}
                <circle
                  cx={getX(idx)}
                  cy={getY(d.taxSaving)}
                  r={isSelected ? 6 : isActive ? 5 : 4}
                  fill={isSelected || isActive ? '#10b981' : '#ffffff'}
                  stroke="#10b981"
                  strokeWidth={isSelected || isActive ? 3 : 2}
                  className="dark:fill-slate-950 transition-all duration-200"
                />
              </g>
            )
          })}
        </svg>

        {/* Floating Tooltip HTML Overlay */}
        {activePoint && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-950/95 dark:bg-slate-950 border border-slate-800 p-2.5 rounded-lg shadow-xl text-xs flex flex-col gap-1 text-slate-100 transition-all duration-200"
            style={{
              left: `${Math.min(
                width - 150,
                Math.max(10, (getX(activeIndex) / width) * 100 - 15)
              )}%`,
              top: '5px',
              width: '145px',
            }}
          >
            <div className="font-bold text-slate-300 pb-1 border-b border-slate-800">
              {activePoint.term} Year Lease Term
            </div>
            <div className="flex justify-between gap-2 mt-1">
              <span className="text-slate-400">Out-of-Pocket:</span>
              <span className="font-semibold text-cyan-400">{fmt(activePoint.outOfPocket)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-400">Tax Savings:</span>
              <span className="font-semibold text-emerald-400">{fmt(activePoint.taxSaving)}</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1 italic text-center">
              Click node to expand details
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
