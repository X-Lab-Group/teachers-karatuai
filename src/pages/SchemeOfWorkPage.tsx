import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarRange, Plus, Trash2, Sparkles, Copy, Download, Check, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button, Card, Input, Select } from '../components/ui'
import { useModel } from '../hooks/useModel'
import { useLocalContext } from '../hooks/useLocalContext'
import { buildSchemePrompt } from '../lib/prompts/lesson-plan'
import { getSchemes, saveScheme, deleteScheme } from '../lib/db'
import { exportAsPDF } from '../lib/print'
import type { EducationLevel, Subject, Term, SchemeOfWork } from '../types'

const SUBJECTS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English Language' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'civic_education', label: 'Civic Education' },
  { value: 'agriculture', label: 'Agricultural Science' },
  { value: 'computer_science', label: 'Computer Science / ICT' },
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

const TERMS: { value: Term; label: string }[] = [
  { value: 'first', label: 'First Term' },
  { value: 'second', label: 'Second Term' },
  { value: 'third', label: 'Third Term' },
]

export default function SchemeOfWorkPage() {
  const { generate, isReady } = useModel()
  const [showForm, setShowForm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [viewing, setViewing] = useState<SchemeOfWork | null>(null)
  const [formData, setFormData] = useState({
    subject: '' as Subject | '',
    level: '' as EducationLevel | '',
    grade: '',
    term: 'first' as Term,
    weekCount: '12',
  })

  const schemes = useLiveQuery(() => getSchemes(), [])
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
      const prompt = buildSchemePrompt({
        subject: formData.subject as Subject,
        level: formData.level as EducationLevel,
        grade: formData.grade,
        term: formData.term,
        weekCount,
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
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{viewing.content}</ReactMarkdown>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleCopy(viewing.content)}
              icon={copied ? <Check size={18} /> : <Copy size={18} />}
              className="flex-1"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportPDF(viewing.content, viewing.title)}
              icon={<Download size={18} />}
              className="flex-1"
            >
              Export PDF
            </Button>
          </div>
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
