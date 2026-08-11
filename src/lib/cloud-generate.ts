const ENDPOINT = (import.meta.env.VITE_GENERATE_ENDPOINT as string | undefined)?.trim() ?? ''

export function isCloudGenerateConfigured(): boolean {
  return ENDPOINT.length > 0
}

export async function probeCloudGenerate(signal?: AbortSignal): Promise<boolean> {
  if (!ENDPOINT) return false
  try {
    const res = await fetch(ENDPOINT, {
      method: 'GET',
      signal,
    })
    if (!res.ok) return false
    const data = (await res.json()) as { ok?: boolean }
    return data.ok === true
  } catch {
    return false
  }
}

export async function cloudGenerate(
  prompt: string,
  onToken?: (token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  if (!ENDPOINT) {
    throw new Error('Cloud generate endpoint is not configured')
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })

  let data: { ok?: boolean; text?: string; error?: string } = {}
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error(`Cloud AI returned invalid JSON (${res.status})`)
  }

  if (!res.ok || !data.ok || !data.text) {
    throw new Error(data.error || `Cloud AI request failed (${res.status})`)
  }

  if (onToken) onToken(data.text)
  return data.text
}
