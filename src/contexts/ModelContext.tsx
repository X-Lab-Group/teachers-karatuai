import { useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'
import {
  ModelStatusContext,
  ModelActionsContext,
  type ModelStatus,
  type ModelBackend,
  type ModelStatusValue,
  type ModelActionsValue,
} from './model-context'
import {
  getCachedModelUrl,
  isModelCached,
  StorageQuotaError,
} from '../lib/model-cache'
import { isIOS } from '../lib/device'
import {
  cloudGenerate,
  isCloudGenerateConfigured,
  probeCloudGenerate,
} from '../lib/cloud-generate'

const INIT_TIMEOUT_MS = 120_000

let llmInstance: LlmInference | null = null
let modelObjectUrl: string | null = null
let activeBackend: ModelBackend = 'none'

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  }) as Promise<T>
}

async function initializeOfflineModel(
  setStatus: (s: ModelStatus) => void,
  setProgress: (n: number) => void,
): Promise<void> {
  if (llmInstance) {
    activeBackend = 'offline'
    setStatus('ready')
    setProgress(100)
    return
  }

  setStatus('checking')
  setProgress(0)

  let loadedFromCache = false
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
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm',
  )

  setProgress(90)

  llmInstance = await withTimeout(
    LlmInference.createFromOptions(genai, {
      baseOptions: {
        modelAssetPath: modelUrl,
      },
      maxTokens: 2048,
      topK: 40,
      temperature: 0.7,
      randomSeed: Date.now(),
    }),
    INIT_TIMEOUT_MS,
    'Model loading timed out. Please check your connection and try again.',
  )

  activeBackend = 'offline'
  setStatus('ready')
  setProgress(100)
}

export default function ModelProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ModelStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [backend, setBackend] = useState<ModelBackend>('none')
  const initialized = useRef(false)

  const initializeModel = useCallback(async () => {
    setError(null)
    setProgress(0)
    setBackend('none')
    activeBackend = 'none'

    const preferCloud = isCloudGenerateConfigured() && typeof navigator !== 'undefined' && navigator.onLine

    if (preferCloud) {
      setStatus('checking')
      try {
        const ok = await probeCloudGenerate()
        if (ok) {
          activeBackend = 'cloud'
          setBackend('cloud')
          setStatus('ready')
          setProgress(100)
          return
        }
      } catch (err) {
        console.warn('Cloud AI probe failed, falling back to on-device:', err)
      }
    }

    if (isIOS()) {
      activeBackend = 'none'
      setBackend('none')
      setStatus('unsupported')
      setError(null)
      setProgress(0)
      return
    }

    let loadedFromCache = false
    try {
      loadedFromCache = await isModelCached()
      await initializeOfflineModel(setStatus, setProgress)
      setBackend('offline')
    } catch (err) {
      console.error('Model initialization error:', err)
      const baseMsg = err instanceof Error ? err.message : 'Failed to load AI model'
      const suffix =
        loadedFromCache && !(err instanceof StorageQuotaError)
          ? ' Your downloaded model is still saved on this device — try refreshing or opening the app again.'
          : ''
      activeBackend = 'none'
      setBackend('none')
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
    onToken?: (token: string) => void,
  ): Promise<string> => {
    if (activeBackend === 'cloud') {
      return cloudGenerate(prompt, onToken)
    }

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
      },
    )
    return response || cumulative
  }, [])

  const retry = useCallback(() => {
    llmInstance = null
    activeBackend = 'none'
    initialized.current = true
    void initializeModel()
  }, [initializeModel])

  const statusValue = useMemo<ModelStatusValue>(
    () => ({
      status,
      progress,
      error,
      isReady: status === 'ready',
      backend,
    }),
    [status, progress, error, backend],
  )

  const actionsValue = useMemo<ModelActionsValue>(
    () => ({ generate, retry }),
    [generate, retry],
  )

  return (
    <ModelActionsContext.Provider value={actionsValue}>
      <ModelStatusContext.Provider value={statusValue}>
        {children}
      </ModelStatusContext.Provider>
    </ModelActionsContext.Provider>
  )
}
