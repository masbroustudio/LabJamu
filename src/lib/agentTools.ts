/**
 * Client-Side Function Calling Tools for LabJamu Agent
 * Queries Dexie.js (IndexedDB) locally with zero unnecessary data transmission.
 */

import { db } from '@/db'
import { ETHNOPHARMACOLOGY_HERBS } from './herbalDatabase'

export const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_active_ritual',
      description: 'Fetch the active ethnopharmacology ritual, current protocol day, and phase (baseline, treatment, washout).',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_skin_metrics_trend',
      description: 'Fetch recorded quantitative skin biometrics (moisture, redness, texture, radiance, causal weights) from recent sessions.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of recent sessions to retrieve (default 5).',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_safety_alerts',
      description: 'Check the safety circuit breaker status and recent erythema (redness) delta spikes to detect irritation.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_ethnopharmacology_herb',
      description: 'Retrieve scientific botanical, phytochemical, and topical bioactivity data for Indonesian herbal ingredients.',
      parameters: {
        type: 'object',
        properties: {
          herbKeyword: {
            type: 'string',
            description: 'The herb name or keyword, e.g. "temugiring", "beras_putih", "pegagan", "kunyit", "kencur".',
          },
        },
        required: ['herbKeyword'],
      },
    },
  },
]

/**
 * Execute a tool locally on client device against IndexedDB.
 */
export async function executeToolLocally(toolName: string, args: Record<string, any>): Promise<any> {
  switch (toolName) {
    case 'get_active_ritual': {
      const rituals = await db.rituals.where('status').equals('active').toArray()
      const active = rituals[0]
      if (!active) {
        return { active: false, message: 'No active herbal ritual experiment found. User can start one in Studio.' }
      }
      const sessions = await db.sessions.where('ritualId').equals(active.id).toArray()
      return {
        active: true,
        ritualId: active.id,
        name: active.name,
        activeHerb: active.activeHerb,
        protocolDays: active.protocolDays,
        sessionsLogged: sessions.length,
        currentPhase: sessions[sessions.length - 1]?.phase ?? 'baseline',
      }
    }

    case 'get_skin_metrics_trend': {
      const limit = args.limit || 5
      const metrics = await db.skinMetrics.toArray()
      const recent = metrics.slice(-limit)
      if (recent.length === 0) {
        return { count: 0, message: 'No skin scans recorded yet. User should perform a scan in Studio.' }
      }
      return {
        count: recent.length,
        sessions: recent.map(m => ({
          sessionId: m.sessionId,
          moisture: m.uiMoisture,
          redness: m.uiRedness,
          texture: m.uiTexture,
          radiance: m.uiRadiance,
          causalHerbalAttribution: m.causalHerbalWeight ? `${Math.round(m.causalHerbalWeight * 100)}%` : 'Calibrating',
          weatherConfounderAttribution: m.causalWeatherWeight ? `${Math.round(m.causalWeatherWeight * 100)}%` : 'Calibrating',
        })),
      }
    }

    case 'check_safety_alerts': {
      const logs = await db.safetyLogs.orderBy('timestamp').reverse().limit(5).toArray()
      const latest = logs[0]
      if (!latest) {
        return { status: 'stable', message: 'No adverse erythema signals recorded. Skin barrier is calm.' }
      }
      const isTripped = latest.deltaRedness > 20
      return {
        status: isTripped ? 'danger_tripped' : latest.deltaRedness > 10 ? 'warning' : 'safe_and_tolerated',
        latestDeltaRedness: `${latest.deltaRedness > 0 ? '+' : ''}${latest.deltaRedness}%`,
        threshold: '+20.0%',
        actionTaken: latest.actionTaken,
        recentLogsCount: logs.length,
      }
    }

    case 'query_ethnopharmacology_herb': {
      const keyword = (args.herbKeyword || '').toLowerCase()
      // Fuzzy search in ETHNOPHARMACOLOGY_HERBS
      for (const [key, profile] of Object.entries(ETHNOPHARMACOLOGY_HERBS)) {
        if (
          key.includes(keyword) ||
          profile.commonName.toLowerCase().includes(keyword) ||
          profile.botanicalName.toLowerCase().includes(keyword)
        ) {
          return { found: true, herb: profile }
        }
      }
      return {
        found: false,
        message: `Herb "${args.herbKeyword}" not found in local primary registry. Available herbs: Temugiring, Beras Putih, Pegagan, Kunyit, Kencur.`,
      }
    }

    default:
      return { error: `Unknown tool name: ${toolName}` }
  }
}
