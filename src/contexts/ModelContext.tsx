import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai'
import { ModelContext } from './model-context'
import { getCachedModelUrl, isModelCached, MODEL_URL } from '../lib/model-cache'

type ModelStatus = 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error'

let llmInstance: LlmInference | null = null

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

    setStatus('checking')
    setError(null)
    setProgress(0)

    try {
      const cached = await isModelCached()

      if (cached) {
        setStatus('loading')
        setProgress(50)
      } else {
        setStatus('downloading')
      }

      await getCachedModelUrl((downloadProgress) => {
        if (!cached) {
          setProgress(Math.round(downloadProgress * 0.8))
        }
      })

      if (!cached) {
        setStatus('loading')
      }
      setProgress(85)

      const genai = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      )

      setProgress(90)

      llmInstance = await LlmInference.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
        },
        maxTokens: 2048,
        topK: 40,
        temperature: 0.7,
        randomSeed: Date.now(),
      })

      setStatus('ready')
      setProgress(100)
    } catch (err) {
      console.error('Model initialization error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to load AI model'
      setError(errorMsg)
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

    let lastLength = 0
    const response = await llmInstance.generateResponse(
      prompt,
      (partialResult: string) => {
        if (onToken && partialResult && partialResult.length > lastLength) {
          const newContent = partialResult.slice(lastLength)
          onToken(newContent)
          lastLength = partialResult.length
        }
      }
    )
    return response
  }, [])

  const retry = useCallback(() => {
    llmInstance = null
    initializeModel()
  }, [initializeModel])

  return (
    <ModelContext.Provider
      value={{
        status,
        progress,
        error,
        isReady: status === 'ready',
        generate,
        retry,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}
