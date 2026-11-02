import { Droplets, Flame, Sparkles, Activity, UserCheck, Camera, CircleDot, CircleDashed, ShieldAlert } from 'lucide-react'

interface MetricsViewProps {
  metrics?: {
    moisture: number
    redness: number
    texture: number
    radiance: number
    pore?: number
    spot?: number
    acne?: number
    skinType?: string
  } | null
  baselineMetric?: {
    moisture: number
    redness: number
    texture: number
    radiance: number
    pore?: number
    spot?: number
    acne?: number
  } | null
  onScanClick?: () => void
}

export function MetricsView({ metrics, baselineMetric, onScanClick }: MetricsViewProps) {
  if (!metrics) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate/5 text-center space-y-3.5 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-botanical/10 flex items-center justify-center mx-auto text-botanical">
          <Droplets size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate">No Biometrics Recorded Yet</h3>
          <p className="text-xs text-slate-light mt-1 max-w-xs mx-auto leading-relaxed">
            Ingest your face photo via YouCam HD to establish your Day 1 baseline scores and begin tracking real clinical causality.
          </p>
        </div>
        <button
          type="button"
          onClick={onScanClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-botanical text-rice-husk rounded-2xl text-xs font-semibold hover:bg-botanical-light active:scale-95 transition-all shadow-xs"
        >
          <Camera size={14} />
          <span>Ingest First Face Scan</span>
        </button>
      </div>
    )
  }

  // Calculate real deltas against baseline
  const isBaseline = !baselineMetric
  const deltaMoisture = baselineMetric ? metrics.moisture - baselineMetric.moisture : 0
  const deltaRedness = baselineMetric ? metrics.redness - baselineMetric.redness : 0
  const deltaTexture = baselineMetric ? metrics.texture - baselineMetric.texture : 0
  const deltaRadiance = baselineMetric ? metrics.radiance - baselineMetric.radiance : 0
  const deltaPore = (baselineMetric?.pore !== undefined && metrics.pore !== undefined) ? metrics.pore - baselineMetric.pore : 0
  const deltaSpot = (baselineMetric?.spot !== undefined && metrics.spot !== undefined) ? metrics.spot - baselineMetric.spot : 0
  const deltaAcne = (baselineMetric?.acne !== undefined && metrics.acne !== undefined) ? metrics.acne - baselineMetric.acne : 0

  const items = [
    {
      title: 'Moisture / Hydration',
      value: metrics.moisture,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaMoisture > 0 ? '+' : ''}${deltaMoisture}% vs Day 1`,
      icon: Droplets,
      color: 'text-blue-600 bg-blue-50',
      barColor: 'bg-blue-500',
    },
    {
      title: 'Erythema (Redness)',
      value: metrics.redness,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaRedness > 0 ? '+' : ''}${deltaRedness}% vs Day 1`,
      icon: Flame,
      color: 'text-rose-600 bg-rose-50',
      barColor: 'bg-rose-500',
    },
    {
      title: 'Texture Smoothness',
      value: metrics.texture,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaTexture > 0 ? '+' : ''}${deltaTexture}% vs Day 1`,
      icon: Activity,
      color: 'text-amber-600 bg-amber-50',
      barColor: 'bg-amber-500',
    },
    {
      title: 'Radiance & Evenness',
      value: metrics.radiance,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaRadiance > 0 ? '+' : ''}${deltaRadiance}% vs Day 1`,
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50',
      barColor: 'bg-emerald-500',
    },
  ]

  if (metrics.pore !== undefined) {
    items.push({
      title: 'Pore Refinement',
      value: metrics.pore,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaPore > 0 ? '+' : ''}${deltaPore}% vs Day 1`,
      icon: CircleDot,
      color: 'text-purple-600 bg-purple-50',
      barColor: 'bg-purple-500',
    })
  }

  if (metrics.spot !== undefined) {
    items.push({
      title: 'Spot & Pigment Clarity',
      value: metrics.spot,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaSpot > 0 ? '+' : ''}${deltaSpot}% vs Day 1`,
      icon: CircleDashed,
      color: 'text-indigo-600 bg-indigo-50',
      barColor: 'bg-indigo-500',
    })
  }

  if (metrics.acne !== undefined) {
    items.push({
      title: 'Acne & Blemish Calm',
      value: metrics.acne,
      unit: '/100',
      delta: isBaseline
        ? 'Day 1 Baseline'
        : `${deltaAcne > 0 ? '+' : ''}${deltaAcne}% vs Day 1`,
      icon: ShieldAlert,
      color: 'text-teal-600 bg-teal-50',
      barColor: 'bg-teal-500',
    })
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate/5 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate">YouCam HD Biometric Indicators</h3>
          <p className="text-xs text-slate-light">Live scientific values from YouCam API</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>YouCam S2S Active</span>
          </span>
          {metrics.skinType && (
            <span className="text-[10px] font-bold text-botanical uppercase bg-botanical/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <UserCheck size={11} />
              <span>{metrics.skinType}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const Icon = item.icon
          return (
            <div key={item.title} className="p-3.5 rounded-2xl bg-rice-husk border border-slate/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate line-clamp-1">{item.title}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate">{item.value}</span>
                <span className="text-xs text-slate-light">{item.unit}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 my-2">
                <div className={`${item.barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, item.value)}%` }} />
              </div>
              <span className="text-[10px] font-medium text-slate-light">{item.delta}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
