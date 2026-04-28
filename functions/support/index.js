// Cloud Function (gen 2, Node 22) that receives KaratuAI in-app support
// submissions and forwards them to support@karatuai.com via Resend. The
// Resend API key is read from the RESEND_API_KEY env var (set by --set-secrets
// at deploy time), never present in source or in the client bundle.
//
// Deploy:
//   gcloud functions deploy karatuai-support \
//     --gen2 --runtime=nodejs22 --region=us-central1 \
//     --source=functions/support --entry-point=support \
//     --trigger-http --allow-unauthenticated \
//     --set-secrets=RESEND_API_KEY=resend-api-key:latest

import functions from '@google-cloud/functions-framework'
import { Resend } from 'resend'

const SUPPORT_TO = 'support@karatuai.com'
const FROM = 'KaratuAI Support <noreply@karatuai.com>'

functions.http('support', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  let data
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid JSON body' })
    return
  }

  const { kind, subject, message, email, platform, appVersion, modelStatus, userAgent, submittedAt } = data ?? {}

  if (!email || !subject || !message) {
    res.status(400).json({ ok: false, error: 'Missing email, subject, or message' })
    return
  }

  const text = [
    `From:        ${email}`,
    `Kind:        ${kind || ''}`,
    `Platform:    ${platform || ''}  (app v${appVersion || '?'})`,
    `Model:       ${modelStatus || ''}`,
    `Submitted:   ${submittedAt || new Date().toISOString()}`,
    `User agent:  ${userAgent || ''}`,
    '',
    '--- message ---',
    message,
  ].join('\n')

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: SUPPORT_TO,
      replyTo: email,
      subject: `[KaratuAI ${kind || 'support'}] ${subject}`,
      text,
    })
    if (error) throw new Error(error.message || 'Resend rejected the message')
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('support send failed:', err)
    res.status(502).json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
})
