import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Trash2,
  Eye,
  ArrowLeft,
  Sparkles,
  Copy,
  Download,
  Check,
  CalendarRange,
  Lightbulb,
  ClipboardCheck,
  FileText,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select, TextArea } from '../components/ui'
import { useLessonGenerator } from '../hooks/useLessonGenerator'
import { useLocalContext } from '../hooks/useLocalContext'
import {
  getLessonPlans,
  deleteLessonPlan,
  getActivitiesByLessonId,
  getAssessmentsByLessonId,
  getScheme,
  getSettings,
  findCurriculum,
} from '../lib/db'
import { exportAsPDF } from '../lib/print'
import { buildCurriculumContextSection } from '../lib/curriculum-context'
import { SUBJECTS, LEVELS } from '../lib/constants'
import type { EducationLevel, Subject, LessonPlan } from '../types'

interface LessonPrefill {
  topic?: string
  subject?: Subject
  level?: EducationLevel
  grade?: string
  schemeId?: string
  weekNumber?: number
  weekTopic?: string
}

const DURATIONS = [
  { value: '30', label: '30 minutes' },
  { value: '40', label: '40 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
]

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})

type LessonNavState = { prefill?: LessonPrefill; openLessonId?: string } | null

export default function LessonPlannerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navStateOnMount = useState<LessonNavState>(
    () => (location.state as LessonNavState) ?? null,
  )[0]

  const [showForm, setShowForm] = useState(
    Boolean(navStateOnMount?.prefill && !navStateOnMount?.openLessonId),
  )
  const [viewingPlan, setViewingPlan] = useState<string | null>(
    navStateOnMount?.openLessonId ?? null,
  )
  const [formData, setFormData] = useState(() => {
    const p = navStateOnMount?.prefill
    return {
      topic: p?.topic ?? '',
      subject: (p?.subject ?? '') as Subject | '',
      level: (p?.level ?? '') as EducationLevel | '',
      grade: p?.grade ?? '',
      duration: '45',
      additionalContext: '',
    }
  })
  const [parentScheme, setParentScheme] = useState<{
    schemeId: string
    weekNumber?: number
    weekTopic?: string
  } | null>(() => {
    const p = navStateOnMount?.prefill
    if (!p?.schemeId) return null
    return { schemeId: p.schemeId, weekNumber: p.weekNumber, weekTopic: p.weekTopic }
  })
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null)

  const { isGenerating, streamedContent, error, generate, reset } = useLessonGenerator()
  const lessonPlans = useLiveQuery(() => getLessonPlans(), [])
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

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic || !formData.subject || !formData.level) return

    const curriculumSection = buildCurriculumContextSection({
      curriculum: matchedCurriculum,
      topic: formData.topic,
      weekNumber: parentScheme?.weekNumber,
      tokenBudget: 1500,
    })
    const plan = await generate({
      topic: formData.topic,
      subject: formData.subject as Subject,
      level: formData.level as EducationLevel,
      grade: formData.grade,
      duration: parseInt(formData.duration),
      additionalContext: formData.additionalContext,
      localContext,
      curriculumSection,
      schemeId: parentScheme?.schemeId,
      weekNumber: parentScheme?.weekNumber,
      weekTopic: parentScheme?.weekTopic,
    })
    if (plan) setLastGeneratedId(plan.id)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this lesson plan?')) {
      await deleteLessonPlan(id)
    }
  }

  const handleNewPlan = () => {
    setShowForm(true)
    setViewingPlan(null)
    setParentScheme(null)
    setLastGeneratedId(null)
    reset()
    setFormData({
      topic: '',
      subject: '',
      level: '',
      grade: '',
      duration: '45',
      additionalContext: '',
    })
  }

  const buildChildPrefill = (plan: LessonPlan) => ({
    topic: plan.title,
    subject: plan.subject,
    level: plan.level,
    lessonId: plan.id,
    schemeId: plan.schemeId,
  })

  const handleSpawnActivity = (plan: LessonPlan) => {
    navigate('/activities', { state: { prefill: buildChildPrefill(plan) } })
  }

  const handleSpawnAssessment = (plan: LessonPlan) => {
    navigate('/assessments', { state: { prefill: buildChildPrefill(plan) } })
  }

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
    exportAsPDF({ title, content, documentType: 'lesson' })
  }

  if (viewingPlan) {
    const plan = lessonPlans?.find((p) => p.id === viewingPlan)
    if (!plan) return null

    return (
      <LessonDetailView
        plan={plan}
        onBack={() => setViewingPlan(null)}
        onSpawnActivity={() => handleSpawnActivity(plan)}
        onSpawnAssessment={() => handleSpawnAssessment(plan)}
      />
    )
  }

  if (showForm || isGenerating || streamedContent) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Create Lesson Plan</h2>
          {!isGenerating && (
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false)
                setParentScheme(null)
                setLastGeneratedId(null)
                reset()
              }}
            >
              Cancel
            </Button>
          )}
        </div>

        {parentScheme && !isGenerating && !streamedContent && (
          <Card hover={false} className="bg-indigo-50/50 border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CalendarRange size={18} />
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold text-slate-800">
                  Spawning from scheme
                  {parentScheme.weekNumber !== undefined && ` · Week ${parentScheme.weekNumber}`}
                </p>
                {parentScheme.weekTopic && (
                  <p className="text-slate-600 mt-1 truncate">{parentScheme.weekTopic}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setParentScheme(null)}
                className="text-xs text-slate-500 hover:text-slate-700 underline shrink-0"
              >
                Detach
              </button>
            </div>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {!streamedContent && !isGenerating && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <Input
                label="Topic / Lesson Title"
                placeholder="e.g., Introduction to Fractions"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
              />

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
                label="Grade / Year"
                placeholder="e.g., Primary 4, JSS 2, Year 1"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
              />

              <Select
                label="Lesson Duration"
                options={DURATIONS}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />

              <TextArea
                label="Additional Notes (Optional)"
                placeholder="Any specific requirements, student needs, or context..."
                value={formData.additionalContext}
                onChange={(e) => setFormData({ ...formData, additionalContext: e.target.value })}
                rows={3}
              />

              {matchedCurriculum && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-sm">
                  <FileText size={16} className="shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">Curriculum loaded</p>
                    <p className="text-emerald-600 text-xs truncate">{matchedCurriculum.title}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" icon={<Sparkles size={20} />}>
                Generate Lesson Plan
              </Button>
            </motion.form>
          )}

          {(isGenerating || streamedContent) && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card hover={false}>
                {isGenerating && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">
                      <span className="loading loading-dots loading-md text-teal-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Creating your lesson plan...</p>
                      <p className="text-sm text-slate-500">This may take a moment</p>
                    </div>
                  </div>
                )}
                <div className="prose prose-slate max-w-none">
                  {isGenerating ? (
                    <div className="whitespace-pre-wrap font-sans text-slate-700 text-sm leading-relaxed">
                      {streamedContent}
                    </div>
                  ) : (
                    <ReactMarkdown>{streamedContent}</ReactMarkdown>
                  )}
                </div>
                {!isGenerating && streamedContent && (
                  <>
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleCopy(streamedContent)}
                        icon={copied ? <Check size={18} /> : <Copy size={18} />}
                        className="flex-1"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExportPDF(streamedContent, formData.topic || 'Lesson Plan')}
                        icon={<Download size={18} />}
                        className="flex-1"
                      >
                        Export PDF
                      </Button>
                    </div>
                    {lastGeneratedId && (
                      <div className="mt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const plan = lessonPlans?.find((p) => p.id === lastGeneratedId)
                            if (plan) handleSpawnActivity(plan)
                          }}
                          icon={<Lightbulb size={18} />}
                          className="flex-1"
                        >
                          Spawn Activity
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const plan = lessonPlans?.find((p) => p.id === lastGeneratedId)
                            if (plan) handleSpawnAssessment(plan)
                          }}
                          icon={<ClipboardCheck size={18} />}
                          className="flex-1"
                        >
                          Spawn Assessment
                        </Button>
                      </div>
                    )}
                    <div className="mt-4 flex gap-4">
                      <Button onClick={handleNewPlan} className="flex-1" icon={<Plus size={20} />}>
                        Create Another
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowForm(false)
                          setParentScheme(null)
                          setLastGeneratedId(null)
                          reset()
                        }}
                      >
                        View All
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
        <div className="w-12 h-12 rounded-2xl icon-teal flex items-center justify-center">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lesson Plans</h2>
          <p className="text-sm text-slate-500">Create AI-powered lesson plans</p>
        </div>
      </div>

      <Button onClick={handleNewPlan} className="w-full" size="lg" icon={<Plus size={20} />}>
        Create New Lesson Plan
      </Button>

      {lessonPlans?.length === 0 && (
        <Card className="text-center py-12" hover={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">No lesson plans yet</p>
          <p className="text-slate-400 mt-1">Tap the button above to create your first one!</p>
        </Card>
      )}

      <div className="space-y-4">
        {lessonPlans?.map((plan, index) => (
          <Card key={plan.id} delay={index} className="cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1" onClick={() => setViewingPlan(plan.id)}>
                <h3 className="font-semibold text-slate-800 text-lg">{plan.title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {plan.grade} &bull; {plan.duration} mins &bull;{' '}
                  {DATE_FORMATTER.format(new Date(plan.createdAt))}
                </p>
                {plan.schemeId && plan.weekNumber !== undefined && (
                  <p className="text-xs font-medium text-indigo-500 mt-2 inline-flex items-center gap-1">
                    <CalendarRange size={12} />
                    From scheme · Week {plan.weekNumber}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewingPlan(plan.id)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-colors"
                  aria-label="View plan"
                >
                  <Eye size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Delete plan"
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

interface LessonDetailViewProps {
  plan: LessonPlan
  onBack: () => void
  onSpawnActivity: () => void
  onSpawnAssessment: () => void
}

function LessonDetailView({
  plan,
  onBack,
  onSpawnActivity,
  onSpawnAssessment,
}: LessonDetailViewProps) {
  const activities = useLiveQuery(() => getActivitiesByLessonId(plan.id), [plan.id]) ?? []
  const assessments = useLiveQuery(() => getAssessmentsByLessonId(plan.id), [plan.id]) ?? []
  const scheme = useLiveQuery(
    () => (plan.schemeId ? getScheme(plan.schemeId) : undefined),
    [plan.schemeId],
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={20} />}>
        Back
      </Button>

      {scheme && (
        <Card hover={false} className="bg-indigo-50/50 border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <CalendarRange size={18} />
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-semibold text-slate-800 truncate">{scheme.title}</p>
              {plan.weekNumber !== undefined && plan.weekTopic && (
                <p className="text-slate-600 mt-1 truncate">
                  Week {plan.weekNumber} · {plan.weekTopic}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card title={plan.title} subtitle={`${plan.grade} | ${plan.duration} minutes`} hover={false}>
        <div className="prose prose-slate max-w-none">
          <h3 className="text-lg font-bold text-slate-800 mt-6">Learning Objectives</h3>
          <ul className="space-y-1">
            {plan.objectives.map((obj, i) => (
              <li key={i} className="text-slate-600">
                {obj}
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Materials Needed</h3>
          <ul className="space-y-1">
            {plan.materials.map((mat, i) => (
              <li key={i} className="text-slate-600">
                {mat}
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Introduction</h3>
          <p className="text-slate-600 leading-relaxed">{plan.introduction}</p>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Main Activity</h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{plan.mainActivity}</p>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Conclusion</h3>
          <p className="text-slate-600 leading-relaxed">{plan.conclusion}</p>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Assessment</h3>
          <p className="text-slate-600 leading-relaxed">{plan.assessment}</p>

          {plan.homework && (
            <>
              <h3 className="text-lg font-bold text-slate-800 mt-6">Homework</h3>
              <p className="text-slate-600 leading-relaxed">{plan.homework}</p>
            </>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onSpawnActivity}
            icon={<Lightbulb size={18} />}
            className="flex-1 min-w-[160px]"
          >
            Spawn Activity
          </Button>
          <Button
            variant="outline"
            onClick={onSpawnAssessment}
            icon={<ClipboardCheck size={18} />}
            className="flex-1 min-w-[160px]"
          >
            Spawn Assessment
          </Button>
        </div>
      </Card>

      {activities.length > 0 && (
        <Card hover={false}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-amber-500" />
            <h3 className="text-base font-semibold text-slate-800">
              Activities ({activities.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activities.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-amber-50/60"
              >
                <span className="text-sm text-slate-700 truncate">{a.title}</span>
                <span className="text-xs text-slate-500 capitalize shrink-0">
                  {a.type} · {a.duration}m
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {assessments.length > 0 && (
        <Card hover={false}>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck size={16} className="text-pink-500" />
            <h3 className="text-base font-semibold text-slate-800">
              Assessments ({assessments.length})
            </h3>
          </div>
          <div className="space-y-2">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-pink-50/60"
              >
                <span className="text-sm text-slate-700 truncate">{a.title}</span>
                <span className="text-xs text-slate-500 capitalize shrink-0">{a.type}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  )
}
