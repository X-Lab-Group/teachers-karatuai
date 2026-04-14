import { createContext } from 'react'

type ModelStatus = 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error'

export interface ModelContextValue {
  status: ModelStatus
  progress: number
  error: string | null
  isReady: boolean
  generate: (prompt: string, onToken?: (token: string) => void) => Promise<string>
  retry: () => void
}

export const ModelContext = createContext<ModelContextValue | null>(null)
