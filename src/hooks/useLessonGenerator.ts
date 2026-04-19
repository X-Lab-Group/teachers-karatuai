import { useState, useCallback, useRef, useEffect } from 'react'
import { useModel } from './useModel'
import { buildLessonPlanPrompt } from '../lib/prompts/lesson-plan'
import { saveLessonPlan } from '../lib/db'
import type { EducationLevel, LocalContext, Subject, LessonPlan } from '../types'

const SECTION_REGEX_CACHE = new Map<string, RegExp>()
const TEXT_SECTION_REGEX_CACHE = new Map<string, RegExp>()
const LIST_PREFIX_REGEX = /^[-*•\d.)\s]+/

interface GeneratorInput {
  topic: string
  subject: Subject
  level: EducationLevel
  grade: string
  duration: number
  additionalContext?: string
  localContext?: LocalContext
  curriculumSection?: string
  schemeId?: string
  weekNumber?: number
  weekTopic?: string
}

interface GeneratorState {
  isGenerating: boolean
  streamedContent: string
  error: string | null
}

export function useLessonGenerator() {
  const { generate: modelGenerate, isReady } = useModel()
  const [state, setState] = useState<GeneratorState>({
    isGenerating: false,
    streamedContent: '',
    error: null,
  })

  const bufferRef = useRef('')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const generate = useCallback(async (input: GeneratorInput): Promise<LessonPlan | null> => {
    if (!isReady) {
      setState({ isGenerating: false, streamedContent: '', error: 'AI model is still loading' })
      return null
    }

    bufferRef.current = ''
    setState({ isGenerating: true, streamedContent: '', error: null })

    const flush = () => {
      rafRef.current = null
      const next = bufferRef.current
      setState((prev) => (prev.streamedContent === next ? prev : { ...prev, streamedContent: next }))
    }

    try {
      const prompt = buildLessonPlanPrompt(input)

      const content = await modelGenerate(prompt, (token: string) => {
        bufferRef.current += token
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(flush)
        }
      })

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      const lessonPlan: LessonPlan = {
        id: crypto.randomUUID(),
        title: input.topic,
        subject: input.subject,
        level: input.level,
        grade: input.grade,
        duration: input.duration,
        objectives: extractSection(content, 'objectives'),
        materials: extractSection(content, 'materials'),
        introduction: extractTextSection(content, 'introduction'),
        mainActivity: extractTextSection(content, 'main activity'),
        conclusion: extractTextSection(content, 'conclusion'),
        assessment: extractTextSection(content, 'assessment'),
        homework: extractTextSection(content, 'homework'),
        content,
        schemeId: input.schemeId,
        weekNumber: input.weekNumber,
        weekTopic: input.weekTopic,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await saveLessonPlan(lessonPlan)

      setState({ isGenerating: false, streamedContent: content, error: null })
      return lessonPlan
    } catch (err) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate lesson plan'
      setState({ isGenerating: false, streamedContent: '', error: errorMsg })
      return null
    }
  }, [modelGenerate, isReady])

  const reset = useCallback(() => {
    bufferRef.current = ''
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setState({ isGenerating: false, streamedContent: '', error: null })
  }, [])

  return {
    ...state,
    generate,
    reset,
  }
}

function getSectionRegex(sectionName: string): RegExp {
  let regex = SECTION_REGEX_CACHE.get(sectionName)
  if (!regex) {
    regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n#|\\n\\d\\.|$)`, 'i')
    SECTION_REGEX_CACHE.set(sectionName, regex)
  }
  return regex
}

function getTextSectionRegex(sectionName: string): RegExp {
  let regex = TEXT_SECTION_REGEX_CACHE.get(sectionName)
  if (!regex) {
    regex = new RegExp(`${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`, 'i')
    TEXT_SECTION_REGEX_CACHE.set(sectionName, regex)
  }
  return regex
}

function extractSection(content: string, sectionName: string): string[] {
  const match = content.match(getSectionRegex(sectionName))
  if (!match) return []

  return match[1]
    .split('\n')
    .map((line) => line.replace(LIST_PREFIX_REGEX, '').trim())
    .filter((line) => line.length > 0)
}

function extractTextSection(content: string, sectionName: string): string {
  const match = content.match(getTextSectionRegex(sectionName))
  return match ? match[1].trim() : ''
}
