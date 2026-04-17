import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardCheck, Plus, Trash2, Sparkles, Copy, Download, Check, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select } from '../components/ui'
import { useModel } from '../hooks/useModel'
import { useLocalContext } from '../hooks/useLocalContext'
import { buildAssessmentPrompt } from '../lib/prompts/lesson-plan'
import { getAssessments, saveAssessment, db } from '../lib/db'
import type { EducationLevel, Subject, Assessment } from '../types'

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'other', label: 'Other Subject' },
]

const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'tertiary', label: 'University/Polytechnic' },
]

const ASSESSMENT_TYPES = [
  { value: 'quiz', label: 'Quick Quiz (5-10 questions)' },
  { value: 'test', label: 'Full Test (15-20 questions)' },
  { value: 'worksheet', label: 'Practice Worksheet' },
]

export default function AssessmentsPage() {
  const { generate, isReady } = useModel()
  const [showForm, setShowForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [viewing, setViewing] = useState<Assessment | null>(null)
  const [formData, setFormData] = useState({
    topic: '',
    subject: '' as Subject | '',
    level: '' as EducationLevel | '',
    assessmentType: 'quiz' as 'quiz' | 'test' | 'worksheet',
    questionCount: '10',
  })

  const assessments = useLiveQuery(() => getAssessments(), [])
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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - Assessment</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1, h2 { color: #0d9488; }
            strong { color: #334155; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          <p style="margin-top:40px;color:#94a3b8;text-align:center;">Created with KaratuAI</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
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
      const prompt = buildAssessmentPrompt({
        topic: formData.topic,
        subject: formData.subject as Subject,
        level: formData.level as EducationLevel,
        assessmentType: formData.assessmentType,
        questionCount: parseInt(formData.questionCount),
        localContext,
      })

      await generate(prompt, (token: string) => {
        bufferRef.current += token
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(flush)
        }
      })

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      const finalContent = bufferRef.current
      setGeneratedContent(finalContent)

      const assessment: Assessment = {
        id: crypto.randomUUID(),
        title: formData.topic,
        content: finalContent,
        type: formData.assessmentType,
        questions: [],
        level: formData.level as EducationLevel,
        subject: formData.subject as Subject,
        createdAt: new Date(),
      }

      await saveAssessment(assessment)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this assessment?')) {
      await db.assessments.delete(id)
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
      assessmentType: 'quiz',
      questionCount: '10',
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
              This assessment was saved before content was preserved. Delete and recreate to view
              the full questions.
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
          <h2 className="text-2xl font-bold text-slate-800">Create Assessment</h2>
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
                label="Topic to Assess"
                placeholder="e.g., Addition and Subtraction"
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
                label="Assessment Type"
                options={ASSESSMENT_TYPES}
                value={formData.assessmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assessmentType: e.target.value as 'quiz' | 'test' | 'worksheet',
                  })
                }
              />

              <Input
                label="Number of Questions"
                type="number"
                min="5"
                max="30"
                value={formData.questionCount}
                onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
              />

              <Button type="submit" className="w-full" size="lg" icon={<Sparkles size={20} />}>
                Generate Assessment
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
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center">
                      <span className="loading loading-dots loading-md text-pink-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Creating your assessment...</p>
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
                        onClick={() => handleExportPDF(generatedContent, formData.topic || 'Assessment')}
                        icon={<Download size={18} />}
                        className="flex-1"
                      >
                        Export PDF
                      </Button>
                    </div>
                    <div className="mt-4">
                      <Button onClick={handleReset} className="w-full" icon={<Plus size={20} />}>
                        Create Another Assessment
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
        <div className="w-12 h-12 rounded-2xl icon-pink flex items-center justify-center">
          <ClipboardCheck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Assessments</h2>
          <p className="text-sm text-slate-500">Quizzes, tests & worksheets</p>
        </div>
      </div>

      <Button
        onClick={() => setShowForm(true)}
        className="w-full"
        size="lg"
        icon={<Plus size={20} />}
      >
        Create New Assessment
      </Button>

      {assessments?.length === 0 && (
        <Card className="text-center py-12" hover={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">No assessments yet</p>
          <p className="text-slate-400 mt-1">Create quizzes and tests for your students!</p>
        </Card>
      )}

      <div className="space-y-4">
        {assessments?.map((assessment, index) => (
          <Card key={assessment.id} delay={index}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-lg truncate">{assessment.title}</h3>
                <p className="text-sm text-slate-500 mt-1 capitalize">{assessment.type}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewing(assessment)}
                  className="p-2 rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
                  aria-label="View assessment"
                >
                  <Eye size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(assessment.id)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Delete assessment"
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
