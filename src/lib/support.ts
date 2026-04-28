// Backing store for the in-app support form. Posts to a Google Apps Script
// web app that emails support@karatuai.com (and optionally appends to a
// tracking sheet) on the project's behalf. Endpoint is configured at build
// time via VITE_SUPPORT_FORM_ENDPOINT; when unset (dev / local preview)
// submissions are logged to the console instead of being posted.

export const SUPPORT_FORM_ENDPOINT: string =
  (import.meta.env.VITE_SUPPORT_FORM_ENDPOINT as string | undefined) ?? ''

export type SupportIssueKind = 'bug' | 'question' | 'feature' | 'other'

export const SUPPORT_ISSUE_KINDS: { value: SupportIssueKind; label: string }[] = [
  { value: 'bug', label: 'Something is broken' },
  { value: 'question', label: 'How do I…?' },
  { value: 'feature', label: 'Feature request' },
  { value: 'other', label: 'Other' },
]

export interface SupportFormPayload {
  kind: SupportIssueKind
  subject: string
  message: string
  email: string
}

function detectPlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const cap = (window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string }
  }).Capacitor
  if (cap?.isNativePlatform?.()) {
    const platform = cap.getPlatform?.()
    if (platform === 'ios') return 'ios'
    return 'android'
  }
  return 'web'
}

export async function submitSupportRequest(
  payload: SupportFormPayload,
  appVersion: string,
  modelStatus: string,
): Promise<void> {
  const body = JSON.stringify({
    kind: payload.kind,
    subject: payload.subject,
    message: payload.message,
    email: payload.email,
    platform: detectPlatform(),
    appVersion,
    modelStatus,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    submittedAt: new Date().toISOString(),
  })

  if (!SUPPORT_FORM_ENDPOINT) {
    console.info('[support] no endpoint configured, would have sent:', body)
    return
  }

  // text/plain avoids the CORS preflight; Apps Script reads the raw body
  // via e.postData.contents regardless of the Content-Type header.
  const res = await fetch(SUPPORT_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Support endpoint returned ${res.status}`)
}
