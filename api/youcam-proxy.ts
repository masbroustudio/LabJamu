/**
 * api/youcam-proxy.ts — Vercel Serverless Function
 * Orchestrates the YouCam v2.0 async 3-step skin analysis workflow:
 *   1. POST /s2s/v2.0/file           → get presigned upload URL + file_id
 *   2. PUT  presigned S3 URL         → upload image binary
 *   3. POST /s2s/v2.0/task/skin-analysis → create task
 *   4. GET  /s2s/v2.0/task/skin-analysis/{task_id} → poll until success
 *
 * Image is processed in memory (RAM buffer) only — never written to disk.
 * Zero-retention: buffer = null immediately after upstream call.
 * Runtime: nodejs20.x | Memory: 512MB | maxDuration: 30s
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const YOUCAM_BASE  = process.env.YOUCAM_BASE_URL ?? 'https://yce-api-01.makeupar.com'
const YOUCAM_KEY   = process.env.YOUCAM_API!

// Valid actions: 'acne', 'wrinkle', 'pore', 'texture', 'oiliness', 'moisture', 'firmness', 'age_spot', 'redness', 'skin_type', 'radiance', 'eye_bag'
const DST_ACTIONS = [
  'moisture',
  'redness',
  'texture',
  'oiliness',
  'pore',
  'age_spot',
  'acne',
  'radiance',
  'skin_type'
]
const POLL_INTERVAL_MS  = 1200
const MAX_POLL_ATTEMPTS = 20

async function ycFetch(path: string, options?: RequestInit) {
  const base = process.env.YOUCAM_BASE_URL || 'https://yce-api-01.makeupar.com'
  const key = process.env.YOUCAM_API || ''
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { imageBase64, mimeType = 'image/jpeg', fileName = 'scan_face.jpg' } = req.body
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64 in body' })

    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const fileSize = imageBuffer.byteLength

    // ── Step 1: Init file upload ──────────────────────────────────────────────
    const initRes = await ycFetch('/s2s/v2.0/file', {
      method: 'POST',
      body: JSON.stringify({
        files: [
          {
            content_type: mimeType,
            file_name: fileName,
            file_size: fileSize,
          },
        ],
      }),
    })

    if (!initRes.ok) {
      const t = await initRes.text()
      imageBuffer.fill(0)
      return res.status(initRes.status).json({ error: `YouCam file init failed: ${t}` })
    }

    const initData = await initRes.json()
    const fileItem = initData?.data?.files?.[0]
    if (!fileItem?.file_id || !fileItem?.requests?.[0]?.url) {
      imageBuffer.fill(0)
      return res.status(502).json({ error: 'Invalid file upload descriptor from YouCam' })
    }

    const fileId = fileItem.file_id
    const uploadUrl = fileItem.requests[0].url
    const uploadHeaders = fileItem.requests[0].headers || {}

    // ── Step 2: Upload image to presigned URL ────────────────────────────────
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        ...uploadHeaders,
      },
      body: imageBuffer,
    })

    // Zero-retention: clear buffer from RAM immediately
    imageBuffer.fill(0)

    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({ error: 'YouCam image upload to S3 failed' })
    }

    // ── Step 3: Create skin analysis task ────────────────────────────────────
    const taskRes = await ycFetch('/s2s/v2.0/task/skin-analysis', {
      method: 'POST',
      body: JSON.stringify({
        src_file_id: fileId,
        dst_actions: DST_ACTIONS,
        format: 'json',
      }),
    })

    if (!taskRes.ok) {
      const t = await taskRes.text()
      return res.status(taskRes.status).json({ error: `YouCam task creation failed: ${t}` })
    }

    const taskData = await taskRes.json()
    const taskId = taskData?.task_id || taskData?.data?.task_id

    if (!taskId) {
      return res.status(502).json({ error: 'YouCam did not return task_id', detail: taskData })
    }

    // ── Step 4: Poll for result ───────────────────────────────────────────────
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

      const pollRes = await ycFetch(`/s2s/v2.0/task/skin-analysis/${taskId}`)
      if (!pollRes.ok) {
        console.warn(`[YouCam Poll ${attempt + 1}] HTTP ${pollRes.status}`)
        continue
      }

      const result = await pollRes.json()
      const status = result?.task_status || result?.data?.task_status
      console.log(`[YouCam Task] Poll attempt ${attempt + 1}: ${status}`)

      if (status === 'success') {
        console.log('✓ [YouCam Task Success] Analysis complete, sending results to client.')
        return res.status(200).json({ success: true, data: result })
      }
      if (status === 'failed' || status === 'error') {
        const msg = result?.data?.error_message || result?.error || 'YouCam skin analysis could not process this image.'
        return res.status(422).json({ error: msg, detail: result })
      }
      // task_status === 'processing' or 'running' → keep polling
    }

    return res.status(504).json({ error: 'YouCam analysis timed out after polling' })

  } catch (err) {
    console.error('[YouCam Proxy] Error:', err)
    return res.status(500).json({ error: 'Internal proxy error' })
  }
}
