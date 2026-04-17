import { createContext } from 'react'

export type ModelStatus = 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error'

export interface ModelStatusValue {
  status: ModelStatus
  progress: number
  error: string | null
  isReady: boolean
}

export interface ModelActionsValue {
  generate: (prompt: string, onToken?: (token: string) => void) => Promise<string>
  retry: () => void
}

export const ModelStatusContext = createContext<ModelStatusValue | null>(null)
export const ModelActionsContext = createContext<ModelActionsValue | null>(null)
