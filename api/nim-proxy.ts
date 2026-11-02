/**
 * api/nim-proxy.ts — Vercel Serverless Function
 * Proxies chat requests to NVIDIA NIM keeping NIM_KEY server-side.
 * Supports both local NIM container (http://localhost:8000/v1) and NVIDIA API catalog.
 * Runtime: nodejs20.x
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const NIM_BASE_URL = process.env.NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1'
const NIM_KEY      = process.env.NIM_KEY ?? ''
const NIM_MODEL    = process.env.NIM_MODEL ?? 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const nimBase = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'
  const nimKey = process.env.NIM_KEY || ''
  const defaultModel = process.env.NIM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'

  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { model = defaultModel, messages, temperature = 0.6, max_tokens = 1024, tools, tool_choice } = req.body

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (nimKey && nimKey !== 'not-needed') {
      headers['Authorization'] = `Bearer ${nimKey}`
    }

    const payload: Record<string, any> = {
      model,
      messages,
      temperature,
      max_tokens,
      stream: false,
    }
    if (tools && tools.length > 0) {
      payload.tools = tools
      if (tool_choice) payload.tool_choice = tool_choice
    }

    const nimRes = await fetch(`${nimBase}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!nimRes.ok) {
      const errText = await nimRes.text()
      console.error('[NIM Proxy] Upstream error:', nimRes.status, errText)
      return res.status(nimRes.status).json({
        error: `NIM upstream returned status ${nimRes.status}`,
        detail: errText,
      })
    }

    const data = await nimRes.json()
    return res.status(200).json(data)

  } catch (err: any) {
    console.error('[NIM Proxy] Connection error:', err.message)
    // If local NIM is not yet started, return informative message to client
    return res.status(503).json({
      error: 'NIM deployment unavailable',
      message: 'Could not connect to NIM at ' + NIM_BASE_URL + '. Ensure NIM container is running.',
    })
  }
}
