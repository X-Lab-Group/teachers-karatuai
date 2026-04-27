// Backing store for the "tell us about your classroom" opt-in form. The form
// posts to a Google Apps Script web app that appends a row to a Google Sheet
// owned by the project. The endpoint is configured at build time via the
// VITE_CLASSROOM_FORM_ENDPOINT environment variable; when unset (dev / local
// preview) submissions are logged to the console instead of being posted.

export const CLASSROOM_FORM_ENDPOINT: string =
  (import.meta.env.VITE_CLASSROOM_FORM_ENDPOINT as string | undefined) ?? ''

const SHARED_KEY = 'karatuai:classroom-shared'
const DISMISSED_KEY = 'karatuai:classroom-dismissed'

export type ClassroomEducationLevel =
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'tertiary'
  | 'mixed'

export const CLASSROOM_EDUCATION_LEVELS: { value: ClassroomEducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'junior_secondary', label: 'Junior secondary' },
  { value: 'senior_secondary', label: 'Senior secondary' },
  { value: 'tertiary', label: 'Tertiary / college' },
  { value: 'mixed', label: 'Mixed levels' },
]

export interface ClassroomFormPayload {
  country: string
  educationLevel: ClassroomEducationLevel
  subjects: string[]
  email?: string
}

export function hasInteractedWithClassroomForm(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SHARED_KEY) !== null || localStorage.getItem(DISMISSED_KEY) !== null
}

export function hasSharedClassroomInfo(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SHARED_KEY) !== null
}

export function markClassroomShared(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SHARED_KEY, new Date().toISOString())
}

export function markClassroomDismissed(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(DISMISSED_KEY, new Date().toISOString())
}

export function clearClassroomFlags(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(SHARED_KEY)
  localStorage.removeItem(DISMISSED_KEY)
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

export async function submitClassroomInfo(
  payload: ClassroomFormPayload,
  appVersion: string,
): Promise<void> {
  const body = JSON.stringify({
    country: payload.country,
    educationLevel: payload.educationLevel,
    subjects: payload.subjects.join(', '),
    email: payload.email ?? '',
    platform: detectPlatform(),
    appVersion,
  })

  if (!CLASSROOM_FORM_ENDPOINT) {
    console.info('[share-classroom] no endpoint configured, would have sent:', body)
    return
  }

  // Apps Script web apps require either a simple Content-Type (text/plain)
  // or a fully-configured CORS preflight. Sending text/plain avoids the
  // preflight entirely and Apps Script reads the raw body via
  // e.postData.contents regardless of the Content-Type header.
  const res = await fetch(CLASSROOM_FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body,
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`Form endpoint returned ${res.status}`)
}
