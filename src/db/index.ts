import Dexie, { type EntityTable } from 'dexie'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Phase = 'baseline' | 'treatment' | 'washout'
export type SafetyFlagLevel = 'ok' | 'warn' | 'danger'

export interface Ritual {
  id: string                 // UUID
  name: string               // e.g. "Masker Temugiring & Beras Putih"
  activeHerb: string         // e.g. "temugiring"
  protocolDays: number       // default 14
  status: 'active' | 'completed' | 'paused'
  createdAt: number          // Unix ms
  compatibilityScore?: number
  compatibilityLabel?: string
  clinicalRationale?: string
  targetedPathways?: string[]
  predictedTrajectory?: string
  patchTestGuidance?: string
}

export interface Session {
  id: string
  ritualId: string
  timestamp: number
  phase: Phase
  ambientHumidity: number | null
  ambientTemp: number | null
  uvIndex: number | null
  opfsImagePath: string | null
  userIntakeQuestion?: string
  userIntakeAnswer?: string
}

export interface SkinMetric {
  id: string
  sessionId: string
  timestamp?: number
  // Raw scientific scores (0–100) from YouCam
  rawMoisture: number
  rawRedness: number
  rawTexture: number
  rawRadiance: number
  // UI display scores (may be smoothed)
  uiMoisture: number
  uiRedness: number
  uiTexture: number
  uiRadiance: number
  uiPore?: number
  uiSpot?: number
  uiAcne?: number
  skinType?: string
  maskUrls?: Record<string, string>
  // Causal engine output
  causalHerbalWeight: number | null   // 0–1
  causalWeatherWeight: number | null  // 0–1
  causalExplanation?: string
  clinicalNote?: string
  userIntakeAnswer?: string
}

export interface SafetyLog {
  id: string
  sessionId: string
  deltaRedness: number        // % change from previous session
  flagLevel: SafetyFlagLevel
  actionTaken: string
  timestamp: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  ritualId?: string
  metadata?: {
    type?: 'biometric_scan' | 'text'
    metrics?: {
      moisture: number
      redness: number
      texture: number
      radiance: number
      skinType?: string
    }
    opfsImagePath?: string
  }
}

// ─── Database ─────────────────────────────────────────────────────────────────

export const db = new Dexie('LabJamuDB') as Dexie & {
  rituals:     EntityTable<Ritual,     'id'>
  sessions:    EntityTable<Session,    'id'>
  skinMetrics: EntityTable<SkinMetric, 'id'>
  safetyLogs:  EntityTable<SafetyLog,  'id'>
  chatMessages: EntityTable<ChatMessage, 'id'>
}

db.version(1).stores({
  rituals:      'id, status, createdAt',
  sessions:     'id, ritualId, timestamp, phase',
  skinMetrics:  'id, sessionId',
  safetyLogs:   'id, sessionId, flagLevel, timestamp',
  chatMessages: 'id, role, timestamp, ritualId',
})
