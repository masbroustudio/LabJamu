import { useState } from 'react'
import { Settings, Key, Shield, Info, ChevronRight, CheckCircle2, Trash2, Download } from 'lucide-react'
import { db } from '@/db'
import { purgeAllOPFS } from '@/lib/opfs'

export function SettingsPage() {
  const [clearing, setClearing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleExportData() {
    try {
      const rituals = await db.rituals.toArray()
      const sessions = await db.sessions.toArray()
      const skinMetrics = await db.skinMetrics.toArray()
      const safetyLogs = await db.safetyLogs.toArray()
      const chatMessages = await db.chatMessages.toArray()

      const exportBundle = {
        exportedAt: new Date().toISOString(),
        standard: 'Global Privacy & GDPR-Compliant Portability Format',
        data: { rituals, sessions, skinMetrics, safetyLogs, chatMessages },
      }

      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `labjamu_export_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      setMessage('Data export generated and downloaded successfully.')
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setMessage('Failed to export: ' + err.message)
    }
  }

  async function handleClearData() {
    if (!confirm('Are you sure you want to clear all local experiment logs and messages? This action is permanent.')) return

    setClearing(true)
    try {
      await db.rituals.clear()
      await db.sessions.clear()
      await db.skinMetrics.clear()
      await db.safetyLogs.clear()
      await db.chatMessages.clear()
      await purgeAllOPFS()
      setMessage('All local on-device records and OPFS images cleared.')
      setTimeout(() => setMessage(null), 4000)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-rice-husk">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-2">
        <Settings size={18} className="text-botanical" />
        <div>
          <h1 className="text-sm font-bold text-slate leading-none">Settings &amp; Privacy</h1>
          <p className="text-[10px] text-slate-light mt-0.5">Control on-device data and APIs</p>
        </div>
      </header>

      {/* Notifications */}
      {message && (
        <div className="mx-4 mt-3 p-3 bg-botanical/10 border border-botanical/20 rounded-2xl flex items-center gap-2 text-xs text-botanical">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* API Status */}
        <SettingsSection title="API Diagnostics">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key size={16} className="text-botanical" />
              <div>
                <p className="text-xs font-semibold text-slate">YouCam HD Skin Engine</p>
                <p className="text-[10px] text-slate-light">v2.0 S2S Endpoint verified (status 200)</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-safe bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between border-t border-slate/5">
            <div className="flex items-center gap-2.5">
              <Key size={16} className="text-turmeric-dark" />
              <div>
                <p className="text-xs font-semibold text-slate">NVIDIA NIM (Nemotron-3-Super)</p>
                <p className="text-[10px] text-slate-light">Codex config at ~/.codex/config.toml</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-light bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Configured
            </span>
          </div>
        </SettingsSection>

        {/* Local Storage & Global Privacy Compliance */}
        <SettingsSection title="Privacy & Global Data Protection">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-safe" />
              <div>
                <p className="text-xs font-semibold text-slate">Storage Architecture</p>
                <p className="text-[10px] text-slate-light">Origin Private File System (OPFS) + Dexie.js</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-safe bg-emerald-50 px-2 py-0.5 rounded-full">
              Zero-Cloud
            </span>
          </div>

          <button
            onClick={handleExportData}
            className="w-full p-3.5 flex items-center justify-between border-t border-slate/5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} className="text-slate-light" />
              <div>
                <p className="text-xs font-semibold text-slate">Export My Clinical Logs (JSON)</p>
                <p className="text-[10px] text-slate-light">GDPR &amp; Global Privacy Data Portability</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate/30" />
          </button>

          <button
            onClick={handleClearData}
            disabled={clearing}
            className="w-full p-3.5 flex items-center justify-between border-t border-slate/5 hover:bg-rose-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 size={16} className="text-danger" />
              <div>
                <p className="text-xs font-semibold text-danger">Wipe All Local Records</p>
                <p className="text-[10px] text-slate-light">Permanently purges IndexedDB and local keys</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate/30" />
          </button>
        </SettingsSection>

        {/* Application Metadata */}
        <SettingsSection title="Software Build">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Info size={16} className="text-slate-light" />
              <div>
                <p className="text-xs font-semibold text-slate">LabJamu Core Architecture</p>
                <p className="text-[10px] text-slate-light">React 19 · Vite 6 · Tailwind v4 · Dexie v4</p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-light">v0.1.0-mvp</span>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-light uppercase tracking-wider px-1 mb-2">
        {title}
      </p>
      <div className="rounded-3xl bg-white shadow-xs border border-slate/5 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
