import { useState, useEffect } from 'react'
import {
  FlaskConical,
  Camera,
  PlusCircle,
  RefreshCw,
  X,
  Check,
  Sparkles,
  Clock,
  BookOpen,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Target,
} from 'lucide-react'
import { CameraScanner } from '@/components/studio/CameraScanner'
import { MetricsView } from '@/components/studio/MetricsView'
import { SafetyView } from '@/components/studio/SafetyView'
import { CausalDagView } from '@/components/studio/CausalDagView'
import { TimelineGalleryView } from '@/components/studio/TimelineGalleryView'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Ritual } from '@/db'
import { nanoid } from '@/lib/nanoid'
import { analyzeProtocolCompatibility } from '@/lib/nimClinical'
import type { NavTab } from '@/types'

export type StudioSection = 'overview' | 'timeline' | 'metrics' | 'safety' | 'dag'

interface StudioPageProps {
  initialSection?: StudioSection
  onNavigate?: (tab: NavTab, section?: StudioSection) => void
}

interface ProtocolOption {
  id: string
  name: string
  herbName: string
  botanical: string
  target: string
  traditional: string
}

const NUSANTARA_PROTOCOLS: ProtocolOption[] = [
  {
    id: 'temugiring',
    name: 'Masker Temugiring & Beras Putih',
    herbName: 'Curcuma heyneana (Temugiring)',
    botanical: 'Curcuma heyneana + Oryza sativa',
    target: 'Stratum corneum smoothing, NF-κB erythema calming, barrier lipid renewal',
    traditional: 'Royal Javanese court scrub (Lulur) for skin radiance and calming.',
  },
  {
    id: 'kencur',
    name: 'Bedak Dingin Beras Kencur',
    herbName: 'Kaempferia galanga (Kencur)',
    botanical: 'Kaempferia galanga + Rice Ceramides',
    target: 'EPMC natural broad-spectrum UV protection, thermal barrier cooling',
    traditional: 'Sumatran & Javanese cooling overnight compress for sun-stressed skin.',
  },
  {
    id: 'pegagan',
    name: 'Sari Pegagan Restorative Mask',
    herbName: 'Centella asiatica (Pegagan)',
    botanical: 'Centella asiatica (L.) Urb.',
    target: 'Type I collagen synthesis, madecassoside IL-6 anti-inflammatory pathway',
    traditional: 'Sundanese wound-healing and skin rejuvenation ethnobotanical elixir.',
  },
  {
    id: 'kunyit',
    name: 'Kunyit Asam Purifying Paste',
    herbName: 'Curcuma longa (Kunyit)',
    botanical: 'Curcuma longa + Tamarindus indica',
    target: 'COX-2 cytokine inhibition, microbial acne mitigation, ORAC antioxidant',
    traditional: 'Anti-blemish jamu compress protecting against microbial flare-ups.',
  },
  {
    id: 'sirih',
    name: 'Kompres Daun Sirih Astringent',
    herbName: 'Piper betle (Daun Sirih)',
    botanical: 'Piper betle L.',
    target: 'Chavicol antibacterial tone, pore refinement, sebum oxidation control',
    traditional: 'Traditional astringent antiseptic compress for congested pores.',
  },
]

export function StudioPage({ initialSection = 'overview', onNavigate }: StudioPageProps) {
  const [activeSection, setActiveSection] = useState<StudioSection>(initialSection)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [protocolModalOpen, setProtocolModalOpen] = useState(false)
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('temugiring')
  const [selectedDays, setSelectedDays] = useState<number>(14)
  const [isAnalyzingProtocol, setIsAnalyzingProtocol] = useState(false)
  const [liveMetrics, setLiveMetrics] = useState<{
    moisture: number
    redness: number
    texture: number
    radiance: number
    pore?: number
    spot?: number
    acne?: number
    skinType?: string
  } | null>(null)

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection)
    }
  }, [initialSection])

  const rituals = useLiveQuery(() => db.rituals.toArray(), []) ?? []
  const activeRitual = rituals.find(r => r.status === 'active')

  // Read latest real metrics recorded in IndexedDB (chronologically sorted)
  const allSkinMetrics = useLiveQuery(() => db.skinMetrics.toArray(), []) ?? []
  const allSessions = useLiveQuery(() => db.sessions.toArray(), []) ?? []
  const safetyLogs = useLiveQuery(() => db.safetyLogs.orderBy('timestamp').toArray(), []) ?? []

  const chronoSessions = [...allSessions].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
  const baselineSession = chronoSessions[0]
  const baselineMetric = baselineSession ? allSkinMetrics.find(m => m.sessionId === baselineSession.id) : null

  const sortedSessions = [...allSessions].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
  const latestSession = sortedSessions[0]
  const metricForLatestSession = latestSession ? allSkinMetrics.find(m => m.sessionId === latestSession.id) : null

  const sortedMetrics = [...allSkinMetrics].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
  const latestDbMetric = metricForLatestSession || sortedMetrics[0] || null
  const latestSafetyLog = safetyLogs[safetyLogs.length - 1] || null

  const totalSessionsForRitual = activeRitual ? allSessions.filter(s => s.ritualId === activeRitual.id).length : 0
  const currentDay = Math.min(activeRitual?.protocolDays || 14, Math.max(1, totalSessionsForRitual))
  const progressPercent = activeRitual && totalSessionsForRitual > 0
    ? Math.round((currentDay / activeRitual.protocolDays) * 100)
    : 0
  const phaseLabel = totalSessionsForRitual === 0
    ? 'Phase: Calibrating Baseline'
    : totalSessionsForRitual === 1
    ? 'Phase: Day 1 Baseline'
    : totalSessionsForRitual >= (activeRitual?.protocolDays || 14)
    ? 'Phase: Protocol Completed'
    : `Phase: Active Treatment (Day ${currentDay}/${activeRitual?.protocolDays || 14})`

  const displayMetrics = liveMetrics ?? (latestDbMetric ? {
    moisture: latestDbMetric.uiMoisture,
    redness: latestDbMetric.uiRedness,
    texture: latestDbMetric.uiTexture,
    radiance: latestDbMetric.uiRadiance,
    pore: latestDbMetric.uiPore,
    spot: latestDbMetric.uiSpot,
    acne: latestDbMetric.uiAcne,
    skinType: latestDbMetric.skinType,
  } : null)

  async function handleActivateProtocol() {
    setIsAnalyzingProtocol(true)
    const proto = NUSANTARA_PROTOCOLS.find(p => p.id === selectedProtocolId) || NUSANTARA_PROTOCOLS[0]

    try {
      // 1. Run live NVIDIA Nemotron clinical compatibility analysis
      const evalResult = await analyzeProtocolCompatibility(
        { ...proto, protocolDays: selectedDays },
        displayMetrics
      )

      // 2. Pause any existing active rituals
      const existingActive = await db.rituals.where('status').equals('active').toArray()
      for (const r of existingActive) {
        await db.rituals.update(r.id, { status: 'completed' })
      }

      // 3. Persist new active ritual with Nemotron clinical dossier
      const newRitual: Ritual = {
        id: nanoid(),
        name: proto.name,
        activeHerb: proto.herbName,
        protocolDays: selectedDays,
        status: 'active',
        createdAt: Date.now(),
        compatibilityScore: evalResult.compatibilityScore,
        compatibilityLabel: evalResult.compatibilityLabel,
        clinicalRationale: evalResult.clinicalRationale,
        targetedPathways: evalResult.targetedPathways,
        predictedTrajectory: evalResult.predictedTrajectory,
        patchTestGuidance: evalResult.patchTestGuidance,
      }
      await db.rituals.add(newRitual)

      // 4. Cross-Sync to Chat timeline so user can immediately discuss with AI agent
      await db.chatMessages.add({
        id: nanoid(),
        role: 'assistant',
        content: `🌿 **Nusantara Clinical Protocol Activated: ${proto.name}**\n\n**Botanical Taxon:** ${proto.botanical}\n**Standardized Duration:** ${selectedDays} Days\n\n### NVIDIA Nemotron Clinical Compatibility Analysis\n- **Compatibility Score:** ${evalResult.compatibilityScore}% · *${evalResult.compatibilityLabel}*\n- **Biological Pathways Targeted:** ${evalResult.targetedPathways.join(', ')}\n\n**Molecular Rationale:** ${evalResult.clinicalRationale}\n\n**Predicted Biomarker Trajectory:** ${evalResult.predictedTrajectory}\n\n⚠️ **Patch Test Advisory:** ${evalResult.patchTestGuidance}\n\n*Your trial is now initialized. Take a face scan to record your Day 1 baseline.*`,
        timestamp: Date.now(),
      })

      setProtocolModalOpen(false)
    } catch (err: any) {
      console.error('[Protocol Switcher Error]:', err)
    } finally {
      setIsAnalyzingProtocol(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-rice-husk">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-botanical" />
          <div>
            <h1 className="text-sm font-bold text-slate leading-none">Experiment Studio</h1>
            <p className="text-[10px] text-slate-light mt-0.5">N-of-1 Ethnopharmacology Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProtocolModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate/15 text-slate rounded-full text-xs font-semibold hover:border-botanical/40 active:scale-95 transition-all shadow-xs"
            title="Select or Switch Nusantara Protocol"
          >
            <BookOpen size={12} className="text-botanical" />
            <span>Protocols</span>
          </button>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-botanical text-rice-husk rounded-full text-xs font-semibold shadow-sm hover:bg-botanical-light active:scale-95 transition-all"
          >
            <Camera size={13} />
            <span>Scan Skin</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Active Ritual Card */}
        {activeRitual ? (
          <div className="rounded-3xl bg-botanical p-4 text-rice-husk shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider opacity-80 uppercase">Active Experiment</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  {phaseLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setProtocolModalOpen(true)}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-rice-husk px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={10} />
                  <span>Switch</span>
                </button>
              </div>
            </div>
            <h2 className="text-base font-bold mb-0.5">{activeRitual.name}</h2>
            <p className="text-xs opacity-75">{activeRitual.activeHerb}</p>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] opacity-80">
                <span>Protocol Progress</span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-turmeric h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 border border-dashed border-slate-300 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-botanical/10 flex items-center justify-center mx-auto text-botanical">
              <FlaskConical size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate">No Active Protocol</h3>
              <p className="text-xs text-slate-light mt-0.5 max-w-xs mx-auto">
                Select a standardized Nusantara ethnopharmacology recipe to uncover genuine clinical causality for your skin.
              </p>
            </div>
            <button
              onClick={() => setProtocolModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-botanical text-rice-husk rounded-2xl text-xs font-semibold hover:bg-botanical-light active:scale-95 transition-all shadow-xs"
            >
              <PlusCircle size={14} />
              <span>Choose Nusantara Protocol</span>
            </button>
          </div>
        )}

        {/* ── Nusantara Clinical Dossier Card (Derived from NVIDIA Nemotron) ── */}
        {activeRitual && activeRitual.clinicalRationale && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate/10 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-botanical/10 flex items-center justify-center text-botanical">
                  <Sparkles size={14} className="text-turmeric" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate leading-none">NVIDIA Nemotron Clinical Dossier</h3>
                  <p className="text-[10px] text-slate-light mt-0.5">Biomarker Compatibility &amp; Rationale</p>
                </div>
              </div>
              {activeRitual.compatibilityScore && (
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{activeRitual.compatibilityScore}%</span>
                  <span>{activeRitual.compatibilityLabel || 'Bio-Match'}</span>
                </span>
              )}
            </div>

            {/* Molecular Rationale */}
            <div className="p-3 rounded-2xl bg-rice-husk border border-slate/10 text-xs text-slate space-y-1.5">
              <span className="text-[10px] font-bold text-slate-light uppercase tracking-wider block">
                Phytochemical Interaction Mechanism:
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {activeRitual.clinicalRationale}
              </p>
            </div>

            {/* Targeted Biological Pathways */}
            {activeRitual.targetedPathways && activeRitual.targetedPathways.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-light uppercase tracking-wider flex items-center gap-1">
                  <Target size={11} className="text-botanical" />
                  <span>Targeted Cutaneous Pathways:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {activeRitual.targetedPathways.map((pw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold bg-botanical/5 border border-botanical/15 text-botanical px-2 py-0.5 rounded-lg"
                    >
                      {pw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Predicted Biomarker Trajectory */}
            {activeRitual.predictedTrajectory && (
              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100/70 text-[11px] text-blue-900 space-y-0.5">
                <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">
                  Predicted Longitudinal Outcome:
                </span>
                <p className="leading-relaxed">{activeRitual.predictedTrajectory}</p>
              </div>
            )}

            {/* Patch Test Advisory */}
            {activeRitual.patchTestGuidance && (
              <div className="flex items-start gap-1.5 text-[10px] text-amber-900 bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl">
                <ShieldCheck size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">Patch Test:</span> {activeRitual.patchTestGuidance}
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex-1 py-2 bg-botanical text-rice-husk rounded-xl text-xs font-bold shadow-xs hover:bg-botanical-light active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Camera size={13} />
                <span>Ingest Day 1 Scan</span>
              </button>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="py-2 px-3 bg-white border border-slate/15 text-slate rounded-xl text-xs font-semibold hover:border-botanical/40 active:scale-98 transition-all flex items-center gap-1"
                  title="Ask Nemotron questions about this protocol in Chat"
                >
                  <MessageSquare size={13} className="text-botanical" />
                  <span>Discuss</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex gap-1 bg-slate-200/60 p-1 rounded-2xl text-[11px] font-semibold overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'All Modules' },
            { id: 'timeline', label: 'Timeline & Slider' },
            { id: 'metrics',  label: 'Biometrics' },
            { id: 'safety',   label: 'Safety Circuit' },
            { id: 'dag',      label: 'Causal DAG' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as StudioSection)}
              className={[
                'px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0',
                activeSection === tab.id
                  ? 'bg-white text-slate shadow-xs'
                  : 'text-slate-light hover:text-slate',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Section Rendering with Real DB Data */}
        {(activeSection === 'overview' || activeSection === 'timeline') && (
          <TimelineGalleryView onScanClick={() => setScannerOpen(true)} />
        )}

        {(activeSection === 'overview' || activeSection === 'metrics') && (
          <MetricsView
            metrics={displayMetrics}
            baselineMetric={baselineMetric ? {
              moisture: baselineMetric.uiMoisture,
              redness: baselineMetric.uiRedness,
              texture: baselineMetric.uiTexture,
              radiance: baselineMetric.uiRadiance,
              pore: baselineMetric.uiPore,
              spot: baselineMetric.uiSpot,
              acne: baselineMetric.uiAcne,
            } : null}
            onScanClick={() => setScannerOpen(true)}
          />
        )}

        {(activeSection === 'overview' || activeSection === 'dag') && (
          <CausalDagView
            latestMetric={latestDbMetric}
            latestSession={latestSession}
            activeRitual={activeRitual}
            onScanClick={() => setScannerOpen(true)}
          />
        )}

        {(activeSection === 'overview' || activeSection === 'safety') && (
          <SafetyView
            latestLog={latestSafetyLog}
            onScanClick={() => setScannerOpen(true)}
          />
        )}
      </div>

      {/* Nusantara Recipe / Protocol Switcher Modal */}
      {protocolModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl border border-slate/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-botanical/10 flex items-center justify-center text-botanical">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate leading-none">Nusantara Protocol Switcher</h3>
                  <p className="text-[10px] text-slate-light mt-0.5">Verified Indonesian Ethnopharmacology</p>
                </div>
              </div>
              <button
                onClick={() => !isAnalyzingProtocol && setProtocolModalOpen(false)}
                disabled={isAnalyzingProtocol}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={15} />
              </button>
            </div>

            {/* Protocol Duration Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate flex items-center gap-1">
                <Clock size={13} className="text-botanical" />
                <span>Standardized Trial Duration:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { days: 7, label: '7 Days', desc: 'Rapid Bioassay' },
                  { days: 14, label: '14 Days', desc: 'Standard N-of-1' },
                  { days: 21, label: '21 Days', desc: 'Cellular Cycle' },
                ].map(d => (
                  <button
                    key={d.days}
                    type="button"
                    disabled={isAnalyzingProtocol}
                    onClick={() => setSelectedDays(d.days)}
                    className={[
                      'p-2.5 rounded-2xl text-center border transition-all disabled:opacity-50',
                      selectedDays === d.days
                        ? 'border-botanical bg-botanical/5 text-botanical font-bold shadow-xs'
                        : 'border-slate/15 bg-white text-slate hover:border-slate/30',
                    ].join(' ')}
                  >
                    <span className="block text-xs">{d.label}</span>
                    <span className="block text-[9px] opacity-75 font-normal">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol Recipe Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate flex items-center gap-1">
                <Sparkles size={13} className="text-botanical" />
                <span>Select Herbal Recipe Protocol:</span>
              </label>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {NUSANTARA_PROTOCOLS.map(proto => {
                  const isSelected = selectedProtocolId === proto.id
                  return (
                    <div
                      key={proto.id}
                      onClick={() => !isAnalyzingProtocol && setSelectedProtocolId(proto.id)}
                      className={[
                        'p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1.5',
                        isAnalyzingProtocol ? 'opacity-50 cursor-not-allowed' : '',
                        isSelected
                          ? 'border-botanical bg-botanical/5 ring-1 ring-botanical/30 shadow-xs'
                          : 'border-slate/15 bg-white hover:border-botanical/30',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate">{proto.name}</h4>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-botanical text-rice-husk flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-botanical font-semibold">
                        {proto.botanical}
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate">Clinical Bioactivity:</span> {proto.target}
                      </p>
                      <p className="text-[10px] text-slate-light italic">
                        {proto.traditional}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={isAnalyzingProtocol}
                onClick={() => setProtocolModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate/20 text-xs font-bold text-slate hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAnalyzingProtocol}
                onClick={handleActivateProtocol}
                className="flex-1 py-2.5 rounded-2xl bg-botanical text-rice-husk text-xs font-bold shadow-sm hover:bg-botanical-light active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-75"
              >
                {isAnalyzingProtocol ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing via Nemotron…</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Analyze &amp; Activate Protocol</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Ingestion Modal */}
      {scannerOpen && (
        <CameraScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onViewDashboard={() => {
            setScannerOpen(false)
            setActiveSection('metrics')
          }}
          onScanComplete={metrics => {
            setLiveMetrics(metrics)
            setActiveSection('metrics')
          }}
        />
      )}
    </div>
  )
}
