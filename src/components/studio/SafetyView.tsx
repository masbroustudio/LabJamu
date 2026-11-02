import { ShieldAlert, CheckCircle, AlertOctagon, ShieldCheck, Camera } from 'lucide-react'

interface SafetyViewProps {
  latestLog?: {
    deltaRedness: number
    flagLevel: 'ok' | 'warn' | 'danger'
    actionTaken: string
    timestamp: number
  } | null
  onScanClick?: () => void
}

export function SafetyView({ latestLog, onScanClick }: SafetyViewProps) {
  if (!latestLog) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate/5 text-center space-y-3.5 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-safe/10 flex items-center justify-center mx-auto text-safe">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate">Safety Circuit Uncalibrated</h3>
          <p className="text-xs text-slate-light mt-1 max-w-xs mx-auto leading-relaxed">
            The deterministic erythema trip-wire activates after Day 1 baseline calibration to monitor allergic reactions and barrier spikes.
          </p>
        </div>
        <button
          type="button"
          onClick={onScanClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-botanical text-rice-husk rounded-2xl text-xs font-semibold hover:bg-botanical-light active:scale-95 transition-all shadow-xs"
        >
          <Camera size={14} />
          <span>Ingest Scan to Calibrate</span>
        </button>
      </div>
    )
  }

  const isDanger = latestLog.flagLevel === 'danger'
  const isWarn = latestLog.flagLevel === 'warn'
  const delta = latestLog.deltaRedness

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate/5 space-y-3.5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDanger ? (
            <AlertOctagon size={18} className="text-danger" />
          ) : isWarn ? (
            <ShieldAlert size={18} className="text-warn" />
          ) : (
            <CheckCircle size={18} className="text-safe" />
          )}
          <div>
            <h3 className="text-sm font-bold text-slate leading-none">Safety Circuit Breaker</h3>
            <p className="text-[10px] text-slate-light mt-0.5">Real-time Erythema Variance</p>
          </div>
        </div>
        <span
          className={[
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
            isDanger
              ? 'bg-rose-100 text-danger'
              : isWarn
              ? 'bg-amber-100 text-warn'
              : 'bg-emerald-100 text-safe',
          ].join(' ')}
        >
          {isDanger ? 'TRIPPED (>20%)' : isWarn ? 'CAUTION (>10%)' : 'STABLE & TOLERATED'}
        </span>
      </div>

      <div className="p-3.5 rounded-2xl bg-rice-husk border border-slate/10 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-light">Erythema Variance (ΔRedness)</p>
          <p className="text-lg font-black font-mono text-slate">
            {delta > 0 ? `+${delta}%` : `${delta}%`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-light">Trip Threshold</p>
          <p className="text-xs font-mono font-semibold text-danger">&gt; +20.0%</p>
        </div>
      </div>

      {isDanger ? (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
          <p className="font-bold flex items-center gap-1">
            <AlertOctagon size={14} className="text-danger" />
            <span>Acute Erythema Reaction Detected!</span>
          </p>
          <p className="leading-relaxed">{latestLog.actionTaken}</p>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-light leading-relaxed">
          <p className="font-medium text-slate">{latestLog.actionTaken}</p>
          <p className="text-[10px] mt-0.5 text-slate-400">
            Recorded: {new Date(latestLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  )
}
