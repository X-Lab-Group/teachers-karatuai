import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Trash2, Eye, ArrowLeft, Sparkles, Copy, Download, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select, TextArea } from '../components/ui'
import { useLessonGenerator } from '../hooks/useLessonGenerator'
import { getLessonPlans, deleteLessonPlan } from '../lib/db'
import type { EducationLevel, Subject } from '../types'

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'agriculture', label: 'Agricultural Science' },
  { value: 'computer_science', label: 'Computer Science/ICT' },
  { value: 'business_studies', label: 'Business Studies' },
  { value: 'creative_arts', label: 'Creative Arts' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'religious_studies', label: 'Religious Studies' },
  { value: 'local_language', label: 'Local Language' },
  { value: 'french', label: 'French' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'other', label: 'Other Subject' },
]

const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'tertiary', label: 'University/Polytechnic' },
]

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

export default function LessonPlannerPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewingPlan, setViewingPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    subject: '' as Subject | '',
    level: '' as EducationLevel | '',
    grade: '',
    duration: '45',
    additionalContext: '',
  })

  const { isGenerating, streamedContent, error, generate, reset } = useLessonGenerator()
  const lessonPlans = useLiveQuery(() => getLessonPlans(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic || !formData.subject || !formData.level) return

    await generate({
      topic: formData.topic,
      subject: formData.subject as Subject,
      level: formData.level as EducationLevel,
      grade: formData.grade,
      duration: parseInt(formData.duration),
      additionalContext: formData.additionalContext,
    })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this lesson plan?')) {
      await deleteLessonPlan(id)
    }
  }

  const [copied, setCopied] = useState(false)

  const handleNewPlan = () => {
    setShowForm(true)
    setViewingPlan(null)
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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Lesson Plan</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 24px; }
            h3 { color: #475569; margin-top: 20px; }
            ul, ol { padding-left: 24px; }
            li { margin-bottom: 8px; }
            p { margin-bottom: 12px; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p style="color: #64748b;">Generated by KaratuAI Teacher's Companion</p>
          </div>
          ${content.replace(/^#{1,3}\s/gm, (match) => {
            const level = match.trim().length
            return `<h${level}>`
          }).replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
          <div class="footer">
            <p>Created with KaratuAI - AI-powered lesson planning for African teachers</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (viewingPlan) {
    const plan = lessonPlans?.find((p) => p.id === viewingPlan)
    if (!plan) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Button variant="ghost" onClick={() => setViewingPlan(null)} icon={<ArrowLeft size={20} />}>
          Back
        </Button>
        <Card title={plan.title} subtitle={`${plan.grade} | ${plan.duration} minutes`} hover={false}>
          <div className="prose prose-slate max-w-none">
            <h3 className="text-lg font-bold text-slate-800 mt-6">Learning Objectives</h3>
            <ul className="space-y-1">
              {plan.objectives.map((obj, i) => (
                <li key={i} className="text-slate-600">{obj}</li>
              ))}
            </ul>

            <h3 className="text-lg font-bold text-slate-800 mt-6">Materials Needed</h3>
            <ul className="space-y-1">
              {plan.materials.map((mat, i) => (
                <li key={i} className="text-slate-600">{mat}</li>
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
        </Card>
      </motion.div>
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
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          )}
        </div>

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
                    <div className="mt-4 flex gap-4">
                      <Button onClick={handleNewPlan} className="flex-1" icon={<Plus size={20} />}>
                        Create Another
                      </Button>
                      <Button variant="outline" onClick={() => setShowForm(false)}>
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
