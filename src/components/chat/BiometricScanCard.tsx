import { useState, useEffect } from 'react'
import {
  Sparkles,
  Droplets,
  Flame,
  Activity,
  SlidersHorizontal,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { readFromOPFSAsUrl } from '@/lib/opfs'
import type { NavTab } from '@/types'

export interface BiometricMetrics {
  moisture: number
  redness: number
  texture: number
  radiance: number
  skinType?: string
}

interface BiometricScanCardProps {
  metrics: BiometricMetrics
  opfsImagePath?: string
  timestamp?: number
  onNavigate?: (tab: NavTab, section?: 'overview' | 'metrics' | 'safety' | 'dag' | 'timeline') => void
}

export function BiometricScanCard({
  metrics,
  opfsImagePath,
  timestamp,
  onNavigate,
}: BiometricScanCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let createdUrl: string | null = null

    async function loadPhoto() {
      if (!opfsImagePath) return
      const url = await readFromOPFSAsUrl(opfsImagePath)
      if (active && url) {
        createdUrl = url
        setPhotoUrl(url)
      }
    }

    loadPhoto()

    return () => {
      active = false
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl)
      }
    }
  }, [opfsImagePath])

  const timeString = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now'

  const items = [
    {
      label: 'Moisture',
      value: metrics.moisture,
      icon: Droplets,
      color: 'text-blue-600',
      barColor: 'bg-blue-500',
      badge: metrics.moisture > 70 ? 'Hydrated' : 'Normal',
    },
    {
      label: 'Redness (Erythema)',
      value: metrics.redness,
      icon: Flame,
      color: 'text-rose-600',
      barColor: 'bg-rose-500',
      badge: metrics.redness < 20 ? 'Tolerated' : 'Elevated',
    },
    {
      label: 'Texture',
      value: metrics.texture,
      icon: Activity,
      color: 'text-amber-600',
      barColor: 'bg-amber-500',
      badge: metrics.texture > 70 ? 'Smooth' : 'Moderate',
    },
    {
      label: 'Radiance',
      value: metrics.radiance,
      icon: Sparkles,
      color: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      badge: 'Luminous',
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-botanical/20 shadow-sm overflow-hidden my-1 space-y-3 p-3.5 animate-fade-in-up">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-xs text-slate">YouCam HD Skin Biometrics</span>
        </div>
        <span className="text-[10px] font-mono text-slate-light">{timeString}</span>
      </div>

      {/* Hero row: Photo thumbnail + Skin classification badge */}
      <div className="flex items-center gap-3 bg-rice-husk p-2.5 rounded-xl border border-slate/10">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Face Scan Thumbnail"
            className="w-14 h-14 rounded-xl object-cover border border-botanical/30 flex-shrink-0 shadow-xs"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
            <UserCheck size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-botanical uppercase bg-botanical/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <UserCheck size={11} />
              <span>Type: {metrics.skinType || 'Normal'}</span>
            </span>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              S2S Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-light leading-tight">
            Encrypted to Origin Private File System &amp; local IndexedDB.
          </p>
        </div>
      </div>

      {/* 4 Biometric gauges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-light truncate">{item.label}</span>
                <Icon size={12} className={item.color} />
              </div>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-base font-black font-mono text-slate">{item.value}</span>
                <span className="text-[10px] text-slate-light">/100</span>
                <span className="ml-auto text-[9px] font-semibold text-slate-500 uppercase">{item.badge}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className={`${item.barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, item.value)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Privacy Compliance & Action Buttons */}
      <div className="pt-1 space-y-2">
        <div className="flex items-center gap-1 text-[10px] text-slate-light">
          <ShieldCheck size={12} className="text-safe flex-shrink-0" />
          <span>Local-First · Zero Cloud Storage · Privacy-Preserving Architecture</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigate?.('studio', 'metrics')}
            className="py-2 px-2.5 rounded-xl bg-botanical text-rice-husk font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-botanical-light active:scale-95 transition-all shadow-xs"
          >
            <LayoutDashboard size={13} />
            <span>Studio Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('studio', 'timeline')}
            className="py-2 px-2.5 rounded-xl bg-white border border-botanical/30 text-botanical font-semibold text-[11px] flex items-center justify-center gap-1 hover:bg-botanical/5 active:scale-95 transition-all shadow-xs"
          >
            <SlidersHorizontal size={13} />
            <span>Compare Slider</span>
          </button>
        </div>
      </div>
    </div>
  )
}
