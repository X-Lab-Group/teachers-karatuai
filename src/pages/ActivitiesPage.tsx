import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Plus, Trash2, Sparkles, Copy, Download, Check, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select } from '../components/ui'
import { useModel } from '../hooks/useModel'
import { useLocalContext } from '../hooks/useLocalContext'
import { buildActivityPrompt } from '../lib/prompts/lesson-plan'
import { getActivities, saveActivity, db } from '../lib/db'
import { exportAsPDF } from '../lib/print'
import type { EducationLevel, Subject, Activity } from '../types'

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'creative_arts', label: 'Creative Arts' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'other', label: 'Other Subject' },
]

const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'tertiary', label: 'University/Polytechnic' },
]

const ACTIVITY_TYPES = [
  { value: 'individual', label: 'Individual Work' },
  { value: 'group', label: 'Group Activity' },
  { value: 'class', label: 'Whole Class' },
]

export default function ActivitiesPage() {
  const { generate, isReady } = useModel()
  const [showForm, setShowForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [viewing, setViewing] = useState<Activity | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    subject: '' as Subject | '',
    level: '' as EducationLevel | '',
    activityType: 'group' as 'individual' | 'group' | 'class',
    duration: '20',
  })

  const activities = useLiveQuery(() => getActivities(), [])
  const localContext = useLocalContext()
  const [copied, setCopied] = useState(false)
  const bufferRef = useRef('')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
    exportAsPDF({ title, content, documentType: 'activity' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic || !formData.subject || !formData.level) return
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
      const prompt = buildActivityPrompt({
        topic: formData.topic,
        subject: formData.subject as Subject,
        level: formData.level as EducationLevel,
        activityType: formData.activityType,
        duration: parseInt(formData.duration),
        localContext,
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

      const activity: Activity = {
        id: crypto.randomUUID(),
        title: formData.topic,
        description: '',
        content: finalContent,
        type: formData.activityType,
        duration: parseInt(formData.duration),
        materials: [],
        instructions: [],
        level: formData.level as EducationLevel,
        subject: formData.subject as Subject,
        createdAt: new Date(),
      }

      await saveActivity(activity)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this activity?')) {
      await db.activities.delete(id)
    }
  }

  const handleReset = () => {
    setShowForm(true)
    setGeneratedContent('')
    setViewing(null)
    setFormData({
      topic: '',
      subject: '',
      level: '',
      activityType: 'group',
      duration: '20',
    })
  }

  if (viewing) {
    const content = viewing.content ?? ''
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 truncate pr-3">{viewing.title}</h2>
          <Button variant="ghost" onClick={() => setViewing(null)}>
            Back
          </Button>
        </div>
        <Card hover={false}>
          {content ? (
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              This activity was saved before content was preserved. Delete and recreate to view the
              full plan.
            </p>
          )}
          {content && (
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleCopy(content)}
                icon={copied ? <Check size={18} /> : <Copy size={18} />}
                className="flex-1"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportPDF(content, viewing.title)}
                icon={<Download size={18} />}
                className="flex-1"
              >
                Export PDF
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
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
          <h2 className="text-2xl font-bold text-slate-800">Create Activity</h2>
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
              <Input
                label="Activity Topic"
                placeholder="e.g., Learning about shapes"
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

              <Select
                label="Activity Type"
                options={ACTIVITY_TYPES}
                value={formData.activityType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activityType: e.target.value as 'individual' | 'group' | 'class',
                  })
                }
              />

              <Input
                label="Duration (minutes)"
                type="number"
                min="5"
                max="120"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />

              <Button type="submit" className="w-full" size="lg" icon={<Sparkles size={20} />}>
                Generate Activity
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
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <span className="loading loading-dots loading-md text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Creating your activity...</p>
                      <p className="text-sm text-slate-500">This may take a moment</p>
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
                        onClick={() => handleExportPDF(generatedContent, formData.topic || 'Activity')}
                        icon={<Download size={18} />}
                        className="flex-1"
                      >
                        Export PDF
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Button onClick={handleReset} className="w-full" icon={<Plus size={20} />}>
                        Create Another Activity
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
        <div className="w-12 h-12 rounded-2xl icon-amber flex items-center justify-center">
          <Lightbulb size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Activities</h2>
          <p className="text-sm text-slate-500">Engaging classroom activities</p>
        </div>
      </div>

      <Button
        onClick={() => setShowForm(true)}
        className="w-full"
        size="lg"
        icon={<Plus size={20} />}
      >
        Create New Activity
      </Button>

      {activities?.length === 0 && (
        <Card className="text-center py-12" hover={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">No activities yet</p>
          <p className="text-slate-400 mt-1">Create engaging activities for your students!</p>
        </Card>
      )}

      <div className="space-y-4">
        {activities?.map((activity, index) => (
          <Card key={activity.id} delay={index}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-lg truncate">{activity.title}</h3>
                <p className="text-sm text-slate-500 mt-1 capitalize">
                  {activity.type} &bull; {activity.duration} mins
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewing(activity)}
                  className="p-2 rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                  aria-label="View activity"
                >
                  <Eye size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Delete activity"
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
