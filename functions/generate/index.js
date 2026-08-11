// Cloud Function (gen 2, Node 22) that proxies KaratuAI teacher prompts to
// Gemini. The API key is read from GEMINI_API_KEY (Secret Manager via
// --set-secrets), never present in source or in the client bundle.
//
// Deploy:
//   gcloud functions deploy karatuai-generate \
//     --gen2 --runtime=nodejs22 --region=us-central1 \
//     --source=functions/generate --entry-point=generate \
//     --trigger-http --allow-unauthenticated \
//     --set-secrets=GEMINI_API_KEY=gemini-api-key:latest \
//     --set-env-vars=GEMINI_MODEL=gemini-2.5-flash

import functions from '@google-cloud/functions-framework'
import { GoogleGenerativeAI } from '@google/generative-ai'

const ALLOWED_ORIGINS = new Set([
  'https://teachers.karatuai.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

const MAX_PROMPT_CHARS = 100_000
const RATE_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT = 30

/** @type {Map<string, number[]>} */
const rateBuckets = new Map()

function applyCors(req, res) {
  const origin = req.get('origin') || ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
}

function clientIp(req) {
  const forwarded = req.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.ip || 'unknown'
}

function rateLimitOk(ip) {
  const now = Date.now()
  const prev = rateBuckets.get(ip) || []
  const recent = prev.filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(ip, recent)
    return false
  }
  recent.push(now)
  rateBuckets.set(ip, recent)
  return true
}

functions.http('generate', async (req, res) => {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  if (req.method === 'GET') {
    const key = process.env.GEMINI_API_KEY
    if (!key) {
      res.status(503).json({ ok: false, error: 'GEMINI_API_KEY not configured' })
      return
    }
    res.status(200).json({
      ok: true,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const ip = clientIp(req)
  if (!rateLimitOk(ip)) {
    res.status(429).json({ ok: false, error: 'Too many requests. Try again in a few minutes.' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(503).json({ ok: false, error: 'GEMINI_API_KEY not configured' })
    return
  }

  let data
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body' })
    return
  }

  const prompt = typeof data?.prompt === 'string' ? data.prompt.trim() : ''
  if (!prompt) {
    res.status(400).json({ ok: false, error: 'Missing prompt' })
    return
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    res.status(400).json({ ok: false, error: 'Prompt too large' })
    return
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent(prompt)
    const text = result.response?.text?.() ?? ''
    if (!text) {
      res.status(502).json({ ok: false, error: 'Empty model response' })
      return
    }
    res.status(200).json({ ok: true, text, model: modelName })
  } catch (err) {
    console.error('Gemini generate error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    res.status(502).json({ ok: false, error: message })
  }
})
