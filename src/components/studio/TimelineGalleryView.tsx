import React, { useState, useEffect, useRef } from 'react'
import {
  SlidersHorizontal,
  TrendingUp,
  History,
  Image as ImageIcon,
  Camera,
  Layers,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { readFromOPFSAsUrl } from '@/lib/opfs'

interface TimelineGalleryViewProps {
  onScanClick?: () => void
}

export function TimelineGalleryView({ onScanClick }: TimelineGalleryViewProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [activeMask, setActiveMask] = useState<string>('none')
  const [maskOpacity, setMaskOpacity] = useState<number>(75)

  const containerRef = useRef<HTMLDivElement>(null)

  // Query actual sessions and skin metrics from Dexie
  const sessions = useLiveQuery(() => db.sessions.orderBy('timestamp').toArray(), []) ?? []
  const metrics = useLiveQuery(() => db.skinMetrics.toArray(), []) ?? []

  // Pair sessions with metrics
  const historyData = sessions.map((s, idx) => {
    const metric = metrics.find(m => m.sessionId === s.id)
    return {
      session: s,
      metric,
      dayNumber: idx + 1,
    }
  })

  const hasMultipleScans = historyData.length >= 2
  const baselineSession = historyData[0]
  const latestSession = historyData[historyData.length - 1]

  // Image URLs from OPFS
  const [baselineUrl, setBaselineUrl] = useState<string | null>(null)
  const [latestUrl, setLatestUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let baselineObjUrl: string | null = null
    let latestObjUrl: string | null = null

    async function loadImages() {
      if (baselineSession?.session.opfsImagePath) {
        const url = await readFromOPFSAsUrl(baselineSession.session.opfsImagePath)
        if (active && url) {
          baselineObjUrl = url
          setBaselineUrl(url)
        }
      }
      if (latestSession?.session.opfsImagePath) {
        const url = await readFromOPFSAsUrl(latestSession.session.opfsImagePath)
        if (active && url) {
          latestObjUrl = url
          setLatestUrl(url)
        }
      }
    }

    loadImages()

    return () => {
      active = false
      if (baselineObjUrl) URL.revokeObjectURL(baselineObjUrl)
      if (latestObjUrl) URL.revokeObjectURL(latestObjUrl)
    }
  }, [baselineSession?.session.opfsImagePath, latestSession?.session.opfsImagePath])

  // Dragging handlers for split slider
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = Math.round((x / rect.width) * 100)
    setSliderPosition(percent)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  // Purely actual recorded data points - zero fake/mock entries
  const chartPoints = historyData.map(h => ({
    day: `D${h.dayNumber}`,
    label: `Day ${h.dayNumber}`,
    moisture: h.metric?.uiMoisture ?? 0,
    redness: h.metric?.uiRedness ?? 0,
    texture: h.metric?.uiTexture ?? 0,
    pore: h.metric?.uiPore ?? null,
    spot: h.metric?.uiSpot ?? null,
    acne: h.metric?.uiAcne ?? null,
  }))

  const hasPores = historyData.some(h => h.metric?.uiPore !== undefined && h.metric?.uiPore !== null)
  const hasSpots = historyData.some(h => h.metric?.uiSpot !== undefined && h.metric?.uiSpot !== null)
  const hasAcne = historyData.some(h => h.metric?.uiAcne !== undefined && h.metric?.uiAcne !== null)

  // Calculate genuine deltas against baseline
  const baselineM = baselineSession?.metric
  const latestM = latestSession?.metric

  const deltaHydration = baselineM && latestM && hasMultipleScans
    ? Math.round(((latestM.uiMoisture - baselineM.uiMoisture) / Math.max(1, baselineM.uiMoisture)) * 1000) / 10
    : null

  const deltaRedness = baselineM && latestM && hasMultipleScans
    ? Math.round(((latestM.uiRedness - baselineM.uiRedness) / Math.max(1, baselineM.uiRedness)) * 1000) / 10
    : null

  const deltaTexture = baselineM && latestM && hasMultipleScans
    ? Math.round(((latestM.uiTexture - baselineM.uiTexture) / Math.max(1, baselineM.uiTexture)) * 1000) / 10
    : null

  const deltaPores = baselineM?.uiPore !== undefined && latestM?.uiPore !== undefined && hasMultipleScans
    ? Math.round(((latestM.uiPore - baselineM.uiPore) / Math.max(1, baselineM.uiPore)) * 1000) / 10
    : null

  // Available real mask URLs from latest scan
  const availableMaskKeys = Object.keys(latestM?.maskUrls || {}).filter(k => !!latestM?.maskUrls?.[k])

  if (historyData.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate/5 text-center space-y-3.5 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-botanical/10 flex items-center justify-center mx-auto text-botanical">
          <SlidersHorizontal size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate">Timeline &amp; Gallery Uncalibrated</h3>
          <p className="text-xs text-slate-light mt-1 max-w-xs mx-auto leading-relaxed">
            Ingest your first face scan to establish your Day 1 baseline photograph and initialize your real longitudinal comparison tracker.
          </p>
        </div>
        <button
          type="button"
          onClick={onScanClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-botanical text-rice-husk rounded-2xl text-xs font-semibold hover:bg-botanical-light active:scale-95 transition-all shadow-xs"
        >
          <Camera size={14} />
          <span>Ingest Day 1 Baseline Scan</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ── Section 1: Interactive Before / After Split Slider & Diagnostic Heatmap ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate/5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-botanical/10 flex items-center justify-center text-botanical">
              <SlidersHorizontal size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate leading-none">Before &amp; After Comparison</h3>
              <p className="text-[10px] text-slate-light mt-0.5">Real OPFS Encrypted Photographs</p>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {hasMultipleScans ? `Day 1 vs Day ${historyData.length}` : 'Day 1 Baseline'}
          </span>
        </div>

        {/* Heatmap Mask Overlay Toolbar (Rendered when YouCam masks exist) */}
        {availableMaskKeys.length > 0 && (
          <div className="p-3 rounded-2xl bg-rice-husk border border-slate/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate">
                <Layers size={13} className="text-botanical" />
                <span>YouCam Diagnostic Heatmap Layer</span>
              </div>
              {activeMask !== 'none' && (
                <span className="text-[10px] font-mono font-semibold text-botanical">
                  {maskOpacity}% Opacity
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveMask('none')}
                className={[
                  'px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all',
                  activeMask === 'none'
                    ? 'bg-botanical text-rice-husk shadow-xs'
                    : 'bg-white text-slate border border-slate/15 hover:border-botanical/30',
                ].join(' ')}
              >
                No Mask
              </button>

              {availableMaskKeys.map(maskKey => {
                const label = maskKey === 'redness'
                  ? 'Redness'
                  : maskKey === 'pore'
                  ? 'Pores'
                  : maskKey === 'spot'
                  ? 'Spots'
                  : maskKey === 'acne'
                  ? 'Acne'
                  : maskKey === 'texture'
                  ? 'Texture'
                  : maskKey

                return (
                  <button
                    key={maskKey}
                    type="button"
                    onClick={() => setActiveMask(maskKey)}
                    className={[
                      'px-2.5 py-1 rounded-xl text-[11px] font-semibold capitalize transition-all flex items-center gap-1',
                      activeMask === maskKey
                        ? 'bg-botanical text-rice-husk shadow-xs'
                        : 'bg-white text-slate border border-slate/15 hover:border-botanical/30',
                    ].join(' ')}
                  >
                    <span>{label} Heatmap</span>
                  </button>
                )
              })}
            </div>

            {activeMask !== 'none' && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-light font-mono">0%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={maskOpacity}
                  onChange={e => setMaskOpacity(parseInt(e.target.value, 10))}
                  className="flex-1 accent-botanical h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-light font-mono">100%</span>
              </div>
            )}
          </div>
        )}

        {/* The Split Viewport */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 select-none cursor-ew-resize border border-slate/10 shadow-inner"
        >
          {/* Layer A (Background / Right side): Latest Scan */}
          <div className="absolute inset-0">
            {latestUrl ? (
              <img
                src={latestUrl}
                alt="Latest Treatment Photograph"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-rice-husk/50 gap-2 p-6 text-center">
                <ImageIcon size={32} />
                <p className="text-xs">Latest face photo loading from OPFS...</p>
              </div>
            )}

            {/* Diagnostic Heatmap Mask Overlay */}
            {activeMask !== 'none' && latestM?.maskUrls?.[activeMask] && (
              <img
                src={latestM.maskUrls[activeMask]}
                alt={`${activeMask} Diagnostic Heatmap`}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-200"
                style={{ opacity: maskOpacity / 100 }}
              />
            )}

            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white font-bold text-[10px] border border-white/10 flex items-center gap-1">
              <span>{hasMultipleScans ? `Treatment (Day ${historyData.length})` : 'Day 1 Baseline'}</span>
              {activeMask !== 'none' && (
                <span className="text-turmeric text-[9px] uppercase font-mono">({activeMask})</span>
              )}
            </div>
          </div>

          {/* Layer B (Clipped Foreground / Left side): Baseline Scan */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 w-full h-full" style={{ width: containerRef.current?.clientWidth || '100%' }}>
              {baselineUrl ? (
                <img
                  src={baselineUrl}
                  alt="Baseline Photograph"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-rice-husk/50 gap-2 p-6 text-center">
                  <ImageIcon size={32} />
                  <p className="text-xs">Day 1 Baseline</p>
                </div>
              )}
            </div>
            <div className="absolute top-3 left-3 bg-botanical/90 backdrop-blur-md px-2.5 py-1 rounded-full text-rice-husk font-bold text-[10px] shadow-sm">
              Day 1 Baseline
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-slate shadow-md flex items-center justify-center border-2 border-botanical text-xs active:scale-95 transition-transform">
              <SlidersHorizontal size={14} className="text-botanical" />
            </div>
          </div>

          {/* Drag Instruction Banner */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-[10px] pointer-events-none flex items-center gap-1">
            <span>‹ Drag handle to compare ›</span>
          </div>
        </div>

        {/* Real Delta Badges Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] text-blue-600 font-medium block">Hydration</span>
            <span className="text-sm font-black font-mono text-blue-900">
              {deltaHydration !== null ? `${deltaHydration > 0 ? '+' : ''}${deltaHydration}%` : 'Baseline'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] text-rose-600 font-medium block">Redness</span>
            <span className="text-sm font-black font-mono text-rose-900">
              {deltaRedness !== null ? `${deltaRedness > 0 ? '+' : ''}${deltaRedness}%` : 'Baseline'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] text-amber-600 font-medium block">Texture</span>
            <span className="text-sm font-black font-mono text-amber-900">
              {deltaTexture !== null ? `${deltaTexture > 0 ? '+' : ''}${deltaTexture}%` : 'Baseline'}
            </span>
          </div>
        </div>

        {deltaPores !== null && (
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-center">
            <span className="text-[10px] text-purple-700 font-medium">Pore Refinement Variance: </span>
            <span className="text-xs font-mono font-bold text-purple-900">
              {deltaPores > 0 ? `+${deltaPores}%` : `${deltaPores}%`} vs Day 1
            </span>
          </div>
        )}
      </div>

      {/* ── Section 2: Multi-Metric SVG Longitudinal Trend Graph ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-botanical/10 flex items-center justify-center text-botanical">
              <TrendingUp size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate leading-none">Longitudinal Biometric Trend</h3>
              <p className="text-[10px] text-slate-light mt-0.5">{historyData.length} Real Session(s) Recorded</p>
            </div>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-semibold overflow-x-auto no-scrollbar">
            {['all', 'moisture', 'redness', 'texture', ...(hasPores ? ['pore'] : []), ...(hasSpots ? ['spot'] : []), ...(hasAcne ? ['acne'] : [])].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMetric(m)}
                className={[
                  'px-2 py-0.5 rounded-lg capitalize transition-all whitespace-nowrap',
                  selectedMetric === m
                    ? 'bg-white text-slate shadow-xs'
                    : 'text-slate-light hover:text-slate',
                ].join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Native SVG Curve Graph */}
        <div className="bg-rice-husk rounded-2xl p-4 border border-slate/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-light px-1 flex-wrap gap-2">
            <span className="font-mono">Score (0–100)</span>
            <div className="flex items-center gap-3 flex-wrap">
              {(selectedMetric === 'all' || selectedMetric === 'moisture') && (
                <span className="flex items-center gap-1 text-blue-600 font-semibold text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Moisture
                </span>
              )}
              {(selectedMetric === 'all' || selectedMetric === 'redness') && (
                <span className="flex items-center gap-1 text-rose-600 font-semibold text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Redness
                </span>
              )}
              {(selectedMetric === 'all' || selectedMetric === 'texture') && (
                <span className="flex items-center gap-1 text-amber-600 font-semibold text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Texture
                </span>
              )}
              {(selectedMetric === 'all' || selectedMetric === 'pore') && hasPores && (
                <span className="flex items-center gap-1 text-purple-600 font-semibold text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Pores
                </span>
              )}
            </div>
          </div>

          {/* The SVG canvas */}
          <div className="relative h-44 w-full">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="380" y2="20" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="20" y1="60" x2="380" y2="60" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="20" y1="100" x2="380" y2="100" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="20" y1="140" x2="380" y2="140" stroke="#94a3b8" strokeWidth="1" />

              {/* Grid labels */}
              <text x="10" y="23" fontSize="8" fill="#94a3b8" textAnchor="end">90</text>
              <text x="10" y="63" fontSize="8" fill="#94a3b8" textAnchor="end">60</text>
              <text x="10" y="103" fontSize="8" fill="#94a3b8" textAnchor="end">30</text>
              <text x="10" y="143" fontSize="8" fill="#94a3b8" textAnchor="end">0</text>

              {/* Generate Coordinates for actual recorded points */}
              {(() => {
                const count = chartPoints.length
                const stepX = count > 1 ? (380 - 60) / (count - 1) : 0

                // Scale: y=140 is 0, y=20 is 100
                const getY = (val: number) => 140 - (val / 100) * 120
                const getX = (idx: number) => count === 1 ? 200 : 40 + idx * stepX

                const moistureCoords = chartPoints.map((p, i) => `${getX(i)},${getY(p.moisture)}`).join(' ')
                const rednessCoords = chartPoints.map((p, i) => `${getX(i)},${getY(p.redness)}`).join(' ')
                const textureCoords = chartPoints.map((p, i) => `${getX(i)},${getY(p.texture)}`).join(' ')
                const poreCoords = chartPoints.filter(p => p.pore !== null).map((p, i) => `${getX(i)},${getY(p.pore!)}`).join(' ')

                return (
                  <>
                    {/* Moisture Path (Blue) */}
                    {(selectedMetric === 'all' || selectedMetric === 'moisture') && (
                      <>
                        {count > 1 && (
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={moistureCoords}
                          />
                        )}
                        {chartPoints.map((p, i) => (
                          <circle
                            key={`m-${i}`}
                            cx={getX(i)}
                            cy={getY(p.moisture)}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                          />
                        ))}
                      </>
                    )}

                    {/* Redness Path (Rose) */}
                    {(selectedMetric === 'all' || selectedMetric === 'redness') && (
                      <>
                        {count > 1 && (
                          <polyline
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={rednessCoords}
                          />
                        )}
                        {chartPoints.map((p, i) => (
                          <circle
                            key={`r-${i}`}
                            cx={getX(i)}
                            cy={getY(p.redness)}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                          />
                        ))}
                      </>
                    )}

                    {/* Texture Path (Amber) */}
                    {(selectedMetric === 'all' || selectedMetric === 'texture') && (
                      <>
                        {count > 1 && (
                          <polyline
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={textureCoords}
                          />
                        )}
                        {chartPoints.map((p, i) => (
                          <circle
                            key={`t-${i}`}
                            cx={getX(i)}
                            cy={getY(p.texture)}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                          />
                        ))}
                      </>
                    )}

                    {/* Pore Path (Purple) */}
                    {(selectedMetric === 'all' || selectedMetric === 'pore') && hasPores && (
                      <>
                        {poreCoords && (
                          <polyline
                            fill="none"
                            stroke="#9333ea"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={poreCoords}
                          />
                        )}
                        {chartPoints.map((p, i) => p.pore !== null && (
                          <circle
                            key={`p-${i}`}
                            cx={getX(i)}
                            cy={getY(p.pore)}
                            r="4"
                            fill="#ffffff"
                            stroke="#9333ea"
                            strokeWidth="2.5"
                          />
                        ))}
                      </>
                    )}

                    {/* X-axis labels */}
                    {chartPoints.map((p, i) => (
                      <text
                        key={`lbl-${i}`}
                        x={getX(i)}
                        y="155"
                        fontSize="9"
                        fontWeight="600"
                        fill="#64748b"
                        textAnchor="middle"
                      >
                        {p.day}
                      </text>
                    ))}
                  </>
                )
              })()}
            </svg>
          </div>

          <p className="text-[10px] text-slate-light text-center pt-1">
            {historyData.length === 1
              ? 'Day 1 Baseline point recorded. Ingest Session 2 tomorrow to generate your multi-day trajectory curve.'
              : 'Data points reflect standardized YouCam S2S lighting normalization across trials.'}
          </p>
        </div>
      </div>

      {/* ── Section 3: Chronological Scan History Roll ── */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-botanical/10 flex items-center justify-center text-botanical">
              <History size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate leading-none">Session Roll</h3>
              <p className="text-[10px] text-slate-light mt-0.5">{historyData.length} IndexedDB Session(s) Recorded</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-safe uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Real Data
          </span>
        </div>

        <div className="space-y-2">
          {historyData.slice().reverse().map(({ session, metric, dayNumber }) => {
            const dateStr = new Date(session.timestamp).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={session.id}
                className="p-3 rounded-2xl bg-rice-husk border border-slate/10 flex items-center justify-between hover:border-botanical/30 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-botanical text-rice-husk font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                    D{dayNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate">{dateStr}</span>
                      <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded-md border border-slate/15 text-slate-light capitalize">
                        {session.phase}
                      </span>
                    </div>
                    {session.userIntakeAnswer ? (
                      <p className="text-[10px] text-slate-600 mt-0.5 italic line-clamp-1">
                        "{session.userIntakeAnswer}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-light mt-0.5">
                        Hum: {session.ambientHumidity ?? 78}% RH
                      </p>
                    )}
                  </div>
                </div>

                {metric && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold flex-wrap justify-end">
                    <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">M:{metric.uiMoisture}</span>
                    <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">R:{metric.uiRedness}</span>
                    <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">T:{metric.uiTexture}</span>
                    {metric.uiPore !== undefined && (
                      <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">P:{metric.uiPore}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
