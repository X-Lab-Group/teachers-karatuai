import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarRange,
  Plus,
  Trash2,
  Sparkles,
  Copy,
  Download,
  Check,
  Eye,
  BookOpen,
  ArrowRight,
  FileText,
  Library,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select } from '../components/ui'
import { useModel } from '../hooks/useModel'
import { useLocalContext } from '../hooks/useLocalContext'
import { buildSchemeChunkPrompt, buildSchemeOutlinePrompt } from '../lib/prompts/lesson-plan'
import {
  getSchemes,
  saveScheme,
  deleteScheme,
  getLessonsBySchemeId,
  findCurriculum,
  getCurriculum,
} from '../lib/db'
import { exportAsPDF } from '../lib/print'
import { parseSchemeOutlineWeeks, parseSchemeWeeks, type SchemeWeek } from '../lib/scheme-parser'
import { buildCurriculumContextSection } from '../lib/curriculum-context'
import { SUBJECTS, LEVELS } from '../lib/constants'
import type { EducationLevel, Subject, Term, SchemeOfWork, LessonPlan } from '../types'

const TERMS: { value: Term; label: string }[] = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

const SCHEME_CHUNK_SIZE = 3
const SCHEME_CURRICULUM_TOKEN_BUDGET = 600
const SCHEME_GENERATION_ATTEMPTS = 2
type SchemeWeekDetailKey = Exclude<keyof SchemeWeek, 'number' | 'topic'>
const WEEK_DETAIL_FIELDS: Array<{ key: SchemeWeekDetailKey; label: string }> = [
  { key: 'learningObjectives', label: 'Learning objectives' },
  { key: 'subTopics', label: 'Sub-topics' },
  { key: 'teachingActivities', label: 'Teaching activities' },
  { key: 'materials', label: 'Materials' },
  { key: 'assessment', label: 'Assessment' },
]

interface SchemePrefill {
  subject?: Subject
  level?: EducationLevel
  grade?: string
  curriculumId?: string
}

type SchemeNavState = { prefill?: SchemePrefill } | null

function expectedWeekNumbers(weekCount: number) {
  return Array.from({ length: weekCount }, (_, index) => index + 1)
}

function missingWeekNumbers(weeks: SchemeWeek[], weekCount: number) {
  const found = new Set(weeks.map((week) => week.number))
  return expectedWeekNumbers(weekCount).filter((weekNumber) => !found.has(weekNumber))
}

function missingSelectedWeeks(expectedWeeks: SchemeWeek[], generatedWeeks: SchemeWeek[]) {
  const found = new Set(generatedWeeks.map((week) => week.number))
  return expectedWeeks.map((week) => week.number).filter((weekNumber) => !found.has(weekNumber))
}

function formatWeekList(weekNumbers: number[]) {
  return weekNumbers.join(', ')
}

function chunkWeeks(weeks: SchemeWeek[], size: number) {
  const chunks: SchemeWeek[][] = []
  for (let i = 0; i < weeks.length; i += size) {
    chunks.push(weeks.slice(i, i + size))
  }
  return chunks
}

function normalizeOutlineWeeks(weeks: SchemeWeek[], weekCount: number) {
  const byNumber = new Map(weeks.map((week) => [week.number, week]))
  return expectedWeekNumbers(weekCount)
    .map((weekNumber) => byNumber.get(weekNumber))
    .filter((week): week is SchemeWeek => Boolean(week))
}

export default function SchemeOfWorkPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navStateOnMount = useState<SchemeNavState>(
    () => (location.state as SchemeNavState) ?? null,
  )[0]

  const { generate, isReady } = useModel()
  const [showForm, setShowForm] = useState(Boolean(navStateOnMount?.prefill))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [generationStep, setGenerationStep] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<SchemeOfWork | null>(null)
  const [savedScheme, setSavedScheme] = useState<SchemeOfWork | null>(null)
  const [showRawMarkdown, setShowRawMarkdown] = useState(false)
  const [formData, setFormData] = useState(() => {
    const p = navStateOnMount?.prefill
    return {
      subject: (p?.subject ?? '') as Subject | '',
      level: (p?.level ?? '') as EducationLevel | '',
      grade: p?.grade ?? '',
      term: 'first' as Term,
      weekCount: '12',
    }
  })
  const [parentCurriculumId, setParentCurriculumId] = useState<string | null>(
    () => navStateOnMount?.prefill?.curriculumId ?? null,
  )

  const schemes = useLiveQuery(() => getSchemes(), [])
  const localContext = useLocalContext()
  // An explicit curriculumId from the spawn chain wins over a loose match —
  // it represents the teacher's intent ("build this scheme from THIS syllabus")
  // and survives form-field edits or grade typos.
  const matchedCurriculum = useLiveQuery(
    () => {
      if (parentCurriculumId) return getCurriculum(parentCurriculumId)
      if (formData.subject && formData.level && formData.grade) {
        return findCurriculum({
          level: formData.level as EducationLevel,
          subject: formData.subject as Subject,
          grade: formData.grade,
        })
      }
      return undefined
    },
    [parentCurriculumId, formData.subject, formData.level, formData.grade],
  )
  const [copied, setCopied] = useState(false)
  const bufferRef = useRef('')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleExportPDF = (content: string, title: string) => {
    exportAsPDF({ title, content, documentType: 'scheme' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject || !formData.level || !formData.grade) return
    if (!isReady) return

    setIsGenerating(true)
    setGeneratedContent('')
    setGenerationStep('Planning the term sequence...')
    setGenerationError(null)
    setSavedScheme(null)
    setShowRawMarkdown(false)
    bufferRef.current = ''

    const flush = () => {
      rafRef.current = null
      const next = bufferRef.current
      setGeneratedContent((prev) => (prev === next ? prev : next))
    }

    const queueGeneratedContent = (content: string) => {
      bufferRef.current = content
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush)
      }
    }

    try {
      const weekCount = parseInt(formData.weekCount, 10)
      if (!Number.isFinite(weekCount) || weekCount < 1) {
        throw new Error('Enter a valid number of weeks before generating a scheme.')
      }

      const subject = formData.subject as Subject
      const level = formData.level as EducationLevel
      const termLabel = TERMS.find((t) => t.value === formData.term)?.label ?? ''
      const subjectLabel = SUBJECTS.find((s) => s.value === formData.subject)?.label ?? ''
      const curriculumSection = buildCurriculumContextSection({
        curriculum: matchedCurriculum,
        tokenBudget: SCHEME_CURRICULUM_TOKEN_BUDGET,
      })

      let outlineWeeks: SchemeWeek[] = []
      let missingOutlineWeeks = expectedWeekNumbers(weekCount)

      for (let attempt = 0; attempt < SCHEME_GENERATION_ATTEMPTS; attempt++) {
        setGenerationStep(
          attempt === 0
            ? 'Planning the term sequence...'
            : `Repairing the term sequence for weeks ${formatWeekList(missingOutlineWeeks)}...`,
        )

        const outlinePrompt =
          buildSchemeOutlinePrompt({
            subject,
            level,
            grade: formData.grade,
            term: formData.term,
            weekCount,
            localContext,
            curriculumSection,
          }) +
          (attempt > 0
            ? `\n\nYour previous response missed weeks ${formatWeekList(missingOutlineWeeks)}. Return the full sequence again with exactly ${weekCount} numbered lines.`
            : '')

        const outlineResponse = await generate(outlinePrompt)
        outlineWeeks = normalizeOutlineWeeks(parseSchemeOutlineWeeks(outlineResponse), weekCount)
        missingOutlineWeeks = missingWeekNumbers(outlineWeeks, weekCount)
        if (missingOutlineWeeks.length === 0) break
      }

      if (missingOutlineWeeks.length > 0) {
        throw new Error(
          `The AI could not plan all ${weekCount} weeks. Missing weeks: ${formatWeekList(missingOutlineWeeks)}. Please try again.`,
        )
      }

      let finalContent = ''
      const chunks = chunkWeeks(outlineWeeks, SCHEME_CHUNK_SIZE)

      for (const weeksInChunk of chunks) {
        let chunkContent = ''
        let missingChunkWeeks = weeksInChunk.map((week) => week.number)
        const firstWeek = weeksInChunk[0]?.number
        const lastWeek = weeksInChunk[weeksInChunk.length - 1]?.number

        for (let attempt = 0; attempt < SCHEME_GENERATION_ATTEMPTS; attempt++) {
          let chunkBuffer = ''
          setGenerationStep(
            attempt === 0
              ? `Generating weeks ${firstWeek}-${lastWeek} of ${weekCount}...`
              : `Regenerating weeks ${formatWeekList(missingChunkWeeks)}...`,
          )
          queueGeneratedContent(finalContent)

          const chunkPrompt =
            buildSchemeChunkPrompt({
              subject,
              level,
              grade: formData.grade,
              term: formData.term,
              weekCount,
              outline: outlineWeeks,
              weeks: weeksInChunk,
              localContext,
              curriculumSection,
            }) +
            (attempt > 0
              ? `\n\nYour previous response missed weeks ${formatWeekList(missingChunkWeeks)}. Return all requested week sections again, with headings exactly like "## Week 1: Topic".`
              : '')

          const response = await generate(chunkPrompt, (token: string) => {
            chunkBuffer += token
            queueGeneratedContent([finalContent, chunkBuffer].filter(Boolean).join('\n\n'))
          })

          chunkContent = (response || chunkBuffer).trim()
          missingChunkWeeks = missingSelectedWeeks(weeksInChunk, parseSchemeWeeks(chunkContent))
          if (missingChunkWeeks.length === 0) break
        }

        if (missingChunkWeeks.length > 0) {
          throw new Error(
            `The AI could not complete weeks ${formatWeekList(missingChunkWeeks)}. Please try again.`,
          )
        }

        finalContent = [finalContent, chunkContent].filter(Boolean).join('\n\n')
        queueGeneratedContent(finalContent)
      }

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      const finalWeeks = parseSchemeWeeks(finalContent)
      const missingFinalWeeks = missingWeekNumbers(finalWeeks, weekCount)
      if (missingFinalWeeks.length > 0) {
        throw new Error(
          `The generated scheme is incomplete. Missing weeks: ${formatWeekList(missingFinalWeeks)}. Please try again.`,
        )
      }

      setGeneratedContent(finalContent)

      const scheme: SchemeOfWork = {
        id: crypto.randomUUID(),
        title: `${subjectLabel} - ${formData.grade} - ${termLabel}`,
        subject,
        level,
        grade: formData.grade,
        term: formData.term,
        weekCount,
        content: finalContent,
        curriculumId: parentCurriculumId ?? matchedCurriculum?.id,
        createdAt: new Date(),
      }

      await saveScheme(scheme)
      setSavedScheme(scheme)
    } catch (err) {
      console.error(err)
      if (bufferRef.current) setGeneratedContent(bufferRef.current)
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate the scheme.')
    } finally {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this scheme of work?')) {
      await deleteScheme(id)
    }
  }

  const handleReset = () => {
    setShowForm(true)
    setGeneratedContent('')
    setGenerationStep('')
    setGenerationError(null)
    setViewing(null)
    setSavedScheme(null)
    setParentCurriculumId(null)
    setShowRawMarkdown(false)
    setFormData({
      subject: '',
      level: '',
      grade: '',
      term: 'first',
      weekCount: '12',
    })
  }

  const handleCreateLessonFromScheme = (scheme: SchemeOfWork, week: SchemeWeek) => {
    navigate('/lesson', {
      state: {
        prefill: {
          topic: week.topic,
          subject: scheme.subject,
          level: scheme.level,
          grade: scheme.grade,
          schemeId: scheme.id,
          weekNumber: week.number,
          weekTopic: week.topic,
          curriculumId: scheme.curriculumId,
        },
      },
    })
  }

  const generatedWeeks = generatedContent ? parseSchemeWeeks(generatedContent) : []

  if (viewing) {
    return (
      <SchemeDetailView
        scheme={viewing}
        showRawMarkdown={showRawMarkdown}
        copied={copied}
        onBack={() => {
          setViewing(null)
          setShowRawMarkdown(false)
        }}
        onToggleRaw={() => setShowRawMarkdown((prev) => !prev)}
        onCopy={handleCopy}
        onExportPDF={handleExportPDF}
        onCreateLessonForWeek={(week) => handleCreateLessonFromScheme(viewing, week)}
        onOpenLesson={(lessonId) => {
          navigate('/lesson', { state: { openLessonId: lessonId } })
        }}
      />
    )
  }

  if (showForm || isGenerating || generatedContent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Create Scheme of Work</h2>
          {!isGenerating && (
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false)
                setGeneratedContent('')
                setGenerationError(null)
                setGenerationStep('')
              }}
            >
              Cancel
            </Button>
          )}
        </div>

        {generationError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {generationError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!generatedContent && !isGenerating && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <Select
                label="Subject"
                options={SUBJECTS}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
                required
              />

              <Select
                label="Education Level"
                options={LEVELS}
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value as EducationLevel })
                }
                required
              />

              <Input
                label="Grade / Class / Year"
                placeholder="e.g., Primary 4, JSS 2, SS 1"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
              />

              <Select
                label="Term"
                options={TERMS}
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value as Term })}
              />

              <Input
                label="Number of Weeks"
                type="number"
                min="4"
                max="14"
                value={formData.weekCount}
                onChange={(e) => setFormData({ ...formData, weekCount: e.target.value })}
                helpText="Most African school terms run 10-13 weeks"
              />

              {matchedCurriculum ? (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm">
                  <FileText size={16} className="shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">Curriculum loaded</p>
                    <p className="text-emerald-600 text-xs truncate">{matchedCurriculum.title}</p>
                  </div>
                  {parentCurriculumId && (
                    <button
                      type="button"
                      onClick={() => setParentCurriculumId(null)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 underline shrink-0"
                    >
                      Detach
                    </button>
                  )}
                </div>
              ) : (
                formData.subject &&
                formData.level &&
                formData.grade && (
                  <button
                    type="button"
                    onClick={() => navigate('/curriculum')}
                    className="flex items-start gap-3 w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors text-sm text-left"
                  >
                    <Library size={16} className="shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">No curriculum loaded</p>
                      <p className="text-xs opacity-80">
                        Add the official syllabus first to ground the AI · Tap to open Curriculum
                      </p>
                    </div>
                    <ArrowRight size={14} className="shrink-0 mt-1 opacity-60" />
                  </button>
                )
              )}

              <Button type="submit" className="w-full" size="lg" icon={<Sparkles size={20} />}>
                Generate Scheme of Work
              </Button>
            </motion.form>
          )}

          {(isGenerating || generatedContent) && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover={false}>
                {isGenerating && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <span className="loading loading-dots loading-md text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Building your scheme of work...</p>
                      <p className="text-sm text-slate-500">
                        {generationStep || 'This can take a minute for full terms'}
                      </p>
                    </div>
                  </div>
                )}
                {isGenerating ? (
                  <div className="whitespace-pre-wrap font-sans text-slate-700 text-sm leading-relaxed">
                    {generatedContent}
                  </div>
                ) : generatedWeeks.length > 0 && !showRawMarkdown ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-indigo-50/70 p-4 text-sm text-slate-600">
                    <CalendarRange size={18} className="mt-0.5 shrink-0 text-indigo-500" />
                    <div>
                      <p className="font-semibold text-slate-800">Scheme saved as week cards</p>
                      <p className="mt-1">{generatedWeeks.length} weeks ready for lesson planning.</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                )}
                {!isGenerating && generatedContent && (
                  <>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {generatedWeeks.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setShowRawMarkdown((prev) => !prev)}
                          className="flex-1 min-w-[160px]"
                        >
                          {showRawMarkdown ? 'Show Week Cards' : 'Show Raw Scheme'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(generatedContent)}
                        icon={copied ? <Check size={18} /> : <Copy size={18} />}
                        className="flex-1 min-w-[140px]"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleExportPDF(
                            generatedContent,
                            `${formData.grade} ${formData.subject} Scheme`,
                          )
                        }
                        icon={<Download size={18} />}
                        className="flex-1 min-w-[140px]"
                      >
                        Export PDF
                      </Button>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        icon={<Plus size={20} />}
                        className="flex-1"
                      >
                        Create Another
                      </Button>
                      {savedScheme && (
                        <Button
                          onClick={() => setViewing(savedScheme)}
                          icon={<BookOpen size={20} />}
                          className="flex-1"
                        >
                          Spawn Lessons
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </Card>
              {!isGenerating && generatedWeeks.length > 0 && !showRawMarkdown && (
                <div className="mt-4">
                  <SchemeWeekCards
                    weeks={generatedWeeks}
                    onCreateLessonForWeek={
                      savedScheme
                        ? (week) => handleCreateLessonFromScheme(savedScheme, week)
                        : undefined
                    }
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl icon-indigo flex items-center justify-center">
          <CalendarRange size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Scheme of Work</h2>
          <p className="text-sm text-slate-500">Plan a whole term, week by week</p>
        </div>
      </div>

      <Button
        onClick={() => setShowForm(true)}
        className="w-full"
        size="lg"
        icon={<Plus size={20} />}
      >
        Create New Scheme
      </Button>

      {schemes?.length === 0 && (
        <Card className="text-center py-12" hover={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <CalendarRange size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">No schemes yet</p>
          <p className="text-slate-400 mt-1">Map out a full term in one go!</p>
        </Card>
      )}

      <div className="space-y-4">
        {schemes?.map((scheme, index) => (
          <Card key={scheme.id} delay={index}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-lg truncate">{scheme.title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {scheme.weekCount} weeks &bull; {scheme.grade}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelete(scheme.id)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Delete scheme"
              >
                <Trash2 size={18} />
              </motion.button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewing(scheme)}
                icon={<Eye size={16} />}
                className="flex-1 min-w-[130px]"
              >
                View
              </Button>
              <Button
                size="sm"
                onClick={() => setViewing(scheme)}
                icon={<BookOpen size={16} />}
                className="flex-1 min-w-[150px]"
              >
                Spawn Lessons
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

interface SchemeDetailViewProps {
  scheme: SchemeOfWork
  showRawMarkdown: boolean
  copied: boolean
  onBack: () => void
  onToggleRaw: () => void
  onCopy: (content: string) => void
  onExportPDF: (content: string, title: string) => void
  onCreateLessonForWeek: (week: { number: number; topic: string }) => void
  onOpenLesson: (lessonId: string) => void
}

function SchemeDetailView({
  scheme,
  showRawMarkdown,
  copied,
  onBack,
  onToggleRaw,
  onCopy,
  onExportPDF,
  onCreateLessonForWeek,
  onOpenLesson,
}: SchemeDetailViewProps) {
  const weeks = parseSchemeWeeks(scheme.content)
  const lessons = useLiveQuery(() => getLessonsBySchemeId(scheme.id), [scheme.id]) ?? []
  const lessonsByWeek = new Map<number, typeof lessons>()
  for (const lesson of lessons) {
    if (lesson.weekNumber === undefined) continue
    const existing = lessonsByWeek.get(lesson.weekNumber)
    if (existing) {
      existing.push(lesson)
    } else {
      lessonsByWeek.set(lesson.weekNumber, [lesson])
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800 truncate pr-3">{scheme.title}</h2>
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>

      <Card hover={false} className="bg-indigo-50/40 border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarRange size={20} />
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            <p className="font-medium text-slate-800 mb-1">
              {weeks.length > 0
                ? `Tap a week below to spawn a lesson plan pre-filled from that week's topic.`
                : `We could not parse the weekly breakdown automatically. View the raw scheme below or regenerate it.`}
            </p>
            <p>
              {scheme.weekCount} weeks &bull; {scheme.grade}
            </p>
          </div>
        </div>
      </Card>

      {weeks.length > 0 && !showRawMarkdown && (
        <SchemeWeekCards
          weeks={weeks}
          lessonsByWeek={lessonsByWeek}
          onCreateLessonForWeek={onCreateLessonForWeek}
          onOpenLesson={onOpenLesson}
        />
      )}

      {(showRawMarkdown || weeks.length === 0) && (
        <Card hover={false}>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{scheme.content}</ReactMarkdown>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {weeks.length > 0 && (
          <Button variant="outline" onClick={onToggleRaw} className="flex-1 min-w-[140px]">
            {showRawMarkdown ? 'Show Weeks' : 'Show Raw Scheme'}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => onCopy(scheme.content)}
          icon={copied ? <Check size={18} /> : <Copy size={18} />}
          className="flex-1 min-w-[140px]"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onExportPDF(scheme.content, scheme.title)}
          icon={<Download size={18} />}
          className="flex-1 min-w-[140px]"
        >
          Export PDF
        </Button>
      </div>
    </motion.div>
  )
}

interface SchemeWeekCardsProps {
  weeks: SchemeWeek[]
  lessonsByWeek?: Map<number, LessonPlan[]>
  onCreateLessonForWeek?: (week: SchemeWeek) => void
  onOpenLesson?: (lessonId: string) => void
}

function SchemeWeekCards({
  weeks,
  lessonsByWeek,
  onCreateLessonForWeek,
  onOpenLesson,
}: SchemeWeekCardsProps) {
  return (
    <div className="space-y-3">
      {weeks.map((week) => {
        const weekLessons = lessonsByWeek?.get(week.number) ?? []
        const detailFields = WEEK_DETAIL_FIELDS.map((field) => ({
          ...field,
          value: week[field.key],
        })).filter(
          (field): field is { key: SchemeWeekDetailKey; label: string; value: string } =>
            Boolean(field.value),
        )

        return (
          <Card key={week.number} hover={false}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Week {week.number}
                </p>
                <h3 className="mt-1 text-base font-semibold leading-snug text-slate-800">
                  {week.topic}
                </h3>
              </div>
              {onCreateLessonForWeek && (
                <Button
                  size="sm"
                  onClick={() => onCreateLessonForWeek(week)}
                  icon={<BookOpen size={16} />}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Create Lesson
                </Button>
              )}
            </div>

            {detailFields.length > 0 && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {detailFields.map((field) => (
                  <div key={field.key} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{field.value}</p>
                  </div>
                ))}
              </div>
            )}

            {weekLessons.length > 0 && onOpenLesson && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Saved lessons
                </p>
                {weekLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => onOpenLesson(lesson.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-teal-50"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText size={14} className="shrink-0 text-teal-500" />
                      <span className="truncate text-sm text-slate-700">{lesson.title}</span>
                    </span>
                    <ArrowRight size={14} className="shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
