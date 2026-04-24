import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'
import {
  ModelStatusContext,
  ModelActionsContext,
  type ModelStatus,
  type ModelStatusValue,
  type ModelActionsValue,
} from './model-context'
import {
  getCachedModelUrl,
  isModelCached,
  clearModelCache,
  StorageQuotaError,
} from '../lib/model-cache'
import { isIOS } from '../lib/device'

const INIT_TIMEOUT_MS = 120_000

let llmInstance: LlmInference | null = null
let modelObjectUrl: string | null = null

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  }) as Promise<T>
}

export default function ModelProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ModelStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const initializeModel = useCallback(async () => {
    if (llmInstance) {
      setStatus('ready')
      setProgress(100)
      return
    }

    if (isIOS()) {
      setStatus('unsupported')
      setError(null)
      setProgress(0)
      return
    }

    setStatus('checking')
    setError(null)
    setProgress(0)

    let loadedFromCache = false

    try {
      loadedFromCache = await isModelCached()

      if (loadedFromCache) {
        setStatus('loading')
        setProgress(50)
      } else {
        setStatus('downloading')
      }

      const modelUrl = await getCachedModelUrl((downloadProgress) => {
        if (!loadedFromCache) {
          setProgress(Math.round(downloadProgress * 0.8))
        }
      })

      if (modelObjectUrl && modelObjectUrl !== modelUrl) {
        URL.revokeObjectURL(modelObjectUrl)
      }
      modelObjectUrl = modelUrl.startsWith('blob:') ? modelUrl : null

      if (!loadedFromCache) {
        setStatus('loading')
      }
      setProgress(85)

      const genai = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      )

      setProgress(90)

      llmInstance = await withTimeout(
        LlmInference.createFromOptions(genai, {
          baseOptions: {
            modelAssetPath: modelUrl,
          },
          // KV cache size scales with maxTokens. We keep this conservative
          // because mobile WebKit's per-tab memory budget is tight, and the
          // model bytes already eat most of it.
          maxTokens: 2048,
          topK: 40,
          temperature: 0.7,
          randomSeed: Date.now(),
        }),
        INIT_TIMEOUT_MS,
        'Model loading timed out. Please check your connection and try again.',
      )

      setStatus('ready')
      setProgress(100)
    } catch (err) {
      console.error('Model initialization error:', err)
      // Storage exhaustion: leave any partial chunks in cache so the next
      // attempt resumes after the user frees space, rather than starting over.
      const isQuotaError = err instanceof StorageQuotaError
      if (loadedFromCache && !isQuotaError) {
        await clearModelCache().catch(() => undefined)
      }
      const baseMsg = err instanceof Error ? err.message : 'Failed to load AI model'
      const suffix = loadedFromCache && !isQuotaError
        ? ' Cached model was cleared — try again to re-download.'
        : ''
      setError(baseMsg + suffix)
      setStatus('error')
      setProgress(0)
    }
  }, [])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      initializeModel()
    }
  }, [initializeModel])

  const generate = useCallback(async (
    prompt: string,
    onToken?: (token: string) => void
  ): Promise<string> => {
    if (!llmInstance) {
      throw new Error('Model not ready')
    }

    let cumulative = ''
    const response = await llmInstance.generateResponse(
      prompt,
      (partialResult: string) => {
        if (!partialResult) return
        let delta: string
        if (partialResult.startsWith(cumulative)) {
          delta = partialResult.slice(cumulative.length)
          cumulative = partialResult
        } else {
          delta = partialResult
          cumulative += partialResult
        }
        if (delta && onToken) onToken(delta)
      }
    )
    return response || cumulative
  }, [])

  const retry = useCallback(() => {
    llmInstance = null
    initializeModel()
  }, [initializeModel])

  const statusValue = useMemo<ModelStatusValue>(
    () => ({ status, progress, error, isReady: status === 'ready' }),
    [status, progress, error]
  )

  const actionsValue = useMemo<ModelActionsValue>(
    () => ({ generate, retry }),
    [generate, retry]
  )

  return (
    <ModelActionsContext.Provider value={actionsValue}>
      <ModelStatusContext.Provider value={statusValue}>
        {children}
      </ModelStatusContext.Provider>
    </ModelActionsContext.Provider>
  )
}
