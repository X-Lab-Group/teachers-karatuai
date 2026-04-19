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
import { buildSchemePrompt } from '../lib/prompts/lesson-plan'
import {
  getSchemes,
  saveScheme,
  deleteScheme,
  getLessonsBySchemeId,
  findCurriculum,
  getSettings,
} from '../lib/db'
import { exportAsPDF } from '../lib/print'
import { parseSchemeWeeks } from '../lib/scheme-parser'
import { buildCurriculumContextSection } from '../lib/curriculum-context'
import { SUBJECTS, LEVELS } from '../lib/constants'
import type { EducationLevel, Subject, Term, SchemeOfWork } from '../types'

const TERMS: { value: Term; label: string }[] = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

interface SchemePrefill {
  subject?: Subject
  level?: EducationLevel
  grade?: string
}

type SchemeNavState = { prefill?: SchemePrefill } | null

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
  const [viewing, setViewing] = useState<SchemeOfWork | null>(null)
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

  const schemes = useLiveQuery(() => getSchemes(), [])
  const localContext = useLocalContext()
  const country = useLiveQuery(() => getSettings().then((s) => s.country), [])
  const matchedCurriculum = useLiveQuery(
    () =>
      country && formData.subject && formData.level && formData.grade
        ? findCurriculum({
            country,
            level: formData.level as EducationLevel,
            subject: formData.subject as Subject,
            grade: formData.grade,
          })
        : undefined,
    [country, formData.subject, formData.level, formData.grade],
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
    bufferRef.current = ''

    const flush = () => {
      rafRef.current = null
      const next = bufferRef.current
      setGeneratedContent((prev) => (prev === next ? prev : next))
    }

    try {
      const weekCount = parseInt(formData.weekCount)
      const curriculumSection = buildCurriculumContextSection({
        curriculum: matchedCurriculum,
        tokenBudget: 2500,
      })
      const prompt = buildSchemePrompt({
        subject: formData.subject as Subject,
        level: formData.level as EducationLevel,
        grade: formData.grade,
        term: formData.term,
        weekCount,
        localContext,
        curriculumSection,
      })

      const response = await generate(prompt, (token: string) => {
        bufferRef.current += token
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(flush)
        }
      })

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const finalContent = response || bufferRef.current
      setGeneratedContent(finalContent)

      const termLabel = TERMS.find((t) => t.value === formData.term)?.label ?? ''
      const subjectLabel = SUBJECTS.find((s) => s.value === formData.subject)?.label ?? ''
      const scheme: SchemeOfWork = {
        id: crypto.randomUUID(),
        title: `${subjectLabel} - ${formData.grade} - ${termLabel}`,
        subject: formData.subject as Subject,
        level: formData.level as EducationLevel,
        grade: formData.grade,
        term: formData.term,
        weekCount,
        content: finalContent,
        createdAt: new Date(),
      }

      await saveScheme(scheme)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
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
    setViewing(null)
    setFormData({
      subject: '',
      level: '',
      grade: '',
      term: 'first',
      weekCount: '12',
    })
  }

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
        onCreateLessonForWeek={(week) => {
          navigate('/', {
            state: {
              prefill: {
                topic: week.topic,
                subject: viewing.subject,
                level: viewing.level,
                grade: viewing.grade,
                schemeId: viewing.id,
                weekNumber: week.number,
                weekTopic: week.topic,
              },
            },
          })
        }}
        onOpenLesson={(lessonId) => {
          navigate('/', { state: { openLessonId: lessonId } })
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
            <Button variant="ghost" onClick={() => { setShowForm(false); setGeneratedContent('') }}>
              Cancel
            </Button>
          )}
        </div>

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
                  <div className="min-w-0">
                    <p className="font-semibold truncate">Curriculum loaded</p>
                    <p className="text-emerald-600 text-xs truncate">{matchedCurriculum.title}</p>
                  </div>
                </div>
              ) : (
                country &&
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
                      <p className="text-sm text-slate-500">This can take a minute for full terms</p>
                    </div>
                  </div>
                )}
                <div className="prose prose-slate max-w-none">
                  {isGenerating ? (
                    <div className="whitespace-pre-wrap font-sans text-slate-700 text-sm leading-relaxed">
                      {generatedContent}
                    </div>
                  ) : (
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  )}
                </div>
                {!isGenerating && generatedContent && (
                  <>
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(generatedContent)}
                        icon={copied ? <Check size={18} /> : <Copy size={18} />}
                        className="flex-1"
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
                        className="flex-1"
                      >
                        Export PDF
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Button onClick={handleReset} className="w-full" icon={<Plus size={20} />}>
                        Create Another Scheme
                      </Button>
                    </div>
                  </>
                )}
              </Card>
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
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewing(scheme)}
                  className="p-2 rounded-xl bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors"
                  aria-label="View scheme"
                >
                  <Eye size={18} />
                </motion.button>
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
        <div className="space-y-3">
          {weeks.map((week) => {
            const weekLessons = lessonsByWeek.get(week.number) ?? []
            return (
              <Card key={week.number} hover={false}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                      Week {week.number}
                    </p>
                    <h3 className="font-semibold text-slate-800 text-base mt-1">{week.topic}</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onCreateLessonForWeek(week)}
                    icon={<BookOpen size={16} />}
                  >
                    Create Lesson
                  </Button>
                </div>
                {weekLessons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Saved lessons
                    </p>
                    {weekLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => onOpenLesson(lesson.id)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors text-left"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FileText size={14} className="text-teal-500 shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{lesson.title}</span>
                        </span>
                        <ArrowRight size={14} className="text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
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
