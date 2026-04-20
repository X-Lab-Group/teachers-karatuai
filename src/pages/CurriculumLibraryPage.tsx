import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Library,
  Plus,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  CalendarRange,
  BookOpen,
  Eye,
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { Button, Card, Input, Select, TextArea } from '../components/ui'
import { extractPdfText } from '../lib/pdf-parse'
import {
  getCurricula,
  saveCurriculum,
  deleteCurriculum,
  findCurriculum,
} from '../lib/db'
import { COUNTRY_PRESETS } from '../lib/local-context'
import { SUBJECTS, LEVELS } from '../lib/constants'
import type { Curriculum, EducationLevel, Subject } from '../types'

const COUNTRY_OPTIONS = COUNTRY_PRESETS.map((c) => ({ value: c.code, label: c.name }))
const MAX_PDF_BYTES = 20 * 1024 * 1024
const PREVIEW_CHARS = 320

export default function CurriculumLibraryPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Curriculum | null>(null)
  const [editing, setEditing] = useState<Curriculum | null>(null)
  const [formData, setFormData] = useState({
    country: '',
    level: '' as EducationLevel | '',
    subject: '' as Subject | '',
    grade: '',
    title: '',
    pasteText: '',
    sourceFileName: '',
    parsedText: '',
  })

  const curricula = useLiveQuery(() => getCurricula(), [])

  const resetForm = () => {
    setFormData({
      country: '',
      level: '',
      subject: '',
      grade: '',
      title: '',
      pasteText: '',
      sourceFileName: '',
      parsedText: '',
    })
    setParseError(null)
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_PDF_BYTES) {
      setParseError('PDF is too large. Please use a file under 20 MB or paste the text instead.')
      return
    }
    setIsParsing(true)
    setParseError(null)
    try {
      const text = await extractPdfText(file)
      if (!text.trim()) {
        setParseError('No text found in this PDF. It may be scanned images. Try pasting the text instead.')
        return
      }
      setFormData((prev) => ({
        ...prev,
        sourceFileName: file.name,
        parsedText: text,
        pasteText: '',
      }))
    } catch (err) {
      console.error(err)
      setParseError('Could not read this PDF. Try pasting the text instead.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.country || !formData.level || !formData.subject || !formData.grade) return

    const text = formData.parsedText || formData.pasteText.trim()
    if (!text) {
      setParseError('Upload a PDF or paste curriculum text first.')
      return
    }

    const subjectLabel = SUBJECTS.find((s) => s.value === formData.subject)?.label ?? formData.subject
    const countryLabel =
      COUNTRY_PRESETS.find((c) => c.code === formData.country)?.name ?? formData.country
    const autoTitle = `${countryLabel} · ${subjectLabel} · ${formData.grade}`

    let id: string
    let createdAt: Date

    if (editing) {
      // Explicit edit — keep the original id and timestamp so anything bound
      // to this curriculum (lessons, schemes via curriculumId) stays linked.
      id = editing.id
      createdAt = editing.createdAt
    } else {
      const existing = await findCurriculum({
        level: formData.level as EducationLevel,
        subject: formData.subject as Subject,
        grade: formData.grade,
      })
      if (existing && !confirm(
        `A curriculum already exists for ${countryLabel} ${subjectLabel} ${formData.grade}. Replace it?`,
      )) {
        return
      }
      id = existing?.id ?? crypto.randomUUID()
      createdAt = existing?.createdAt ?? new Date()
    }

    const curriculum: Curriculum = {
      id,
      country: formData.country,
      level: formData.level as EducationLevel,
      subject: formData.subject as Subject,
      grade: formData.grade,
      title: formData.title.trim() || autoTitle,
      sourceFileName: formData.sourceFileName || undefined,
      pasteText: formData.parsedText ? undefined : formData.pasteText.trim(),
      parsedText: text,
      createdAt,
    }

    await saveCurriculum(curriculum)
    resetForm()
    setEditing(null)
    setShowForm(false)
  }

  const handleStartEdit = (c: Curriculum) => {
    setEditing(c)
    setViewing(null)
    setParseError(null)
    setFormData({
      country: c.country,
      level: c.level,
      subject: c.subject,
      grade: c.grade,
      title: c.title,
      pasteText: c.pasteText ?? '',
      sourceFileName: c.sourceFileName ?? '',
      parsedText: c.parsedText,
    })
    setShowForm(true)
  }

  const handleCancelForm = () => {
    resetForm()
    setEditing(null)
    setShowForm(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Remove "${title}" from your library?`)) {
      await deleteCurriculum(id)
      if (viewing?.id === id) setViewing(null)
      if (editing?.id === id) {
        setEditing(null)
        setShowForm(false)
        resetForm()
      }
    }
  }

  const handleCreateScheme = (c: Curriculum) => {
    navigate('/scheme', {
      state: {
        prefill: {
          subject: c.subject,
          level: c.level,
          grade: c.grade,
          curriculumId: c.id,
        },
      },
    })
  }

  const handleCreateLesson = (c: Curriculum) => {
    navigate('/lesson', {
      state: {
        prefill: {
          subject: c.subject,
          level: c.level,
          grade: c.grade,
          curriculumId: c.id,
        },
      },
    })
  }

  if (viewing) {
    return (
      <CurriculumDetailView
        curriculum={viewing}
        onBack={() => setViewing(null)}
        onEdit={() => handleStartEdit(viewing)}
        onDelete={() => handleDelete(viewing.id, viewing.title)}
        onCreateScheme={() => handleCreateScheme(viewing)}
        onCreateLesson={() => handleCreateLesson(viewing)}
      />
    )
  }

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {editing ? 'Update Curriculum' : 'Add Curriculum'}
          </h2>
          <Button variant="ghost" onClick={handleCancelForm}>
            Cancel
          </Button>
        </div>

        <Card hover={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Country"
              options={COUNTRY_OPTIONS}
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
              label="Subject"
              options={SUBJECTS}
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
              required
            />

            <Input
              label="Grade / Class / Year"
              placeholder="e.g., Primary 4, JSS 2, SS 1"
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              required
            />

            <Input
              label="Title (optional)"
              placeholder="e.g., Term 1 Mathematics — Primary 4"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Curriculum Source
              </label>
              <p className="text-sm text-slate-500">
                Tip: add one term, one subject at a time. Smaller entries give sharper, on-syllabus lessons.
              </p>

              <label
                htmlFor="curriculum-pdf"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center shrink-0">
                  {isParsing ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700">
                    {isParsing
                      ? 'Reading PDF...'
                      : formData.sourceFileName
                      ? formData.sourceFileName
                      : 'Tap to upload PDF'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formData.parsedText
                      ? `${formData.parsedText.length.toLocaleString()} characters extracted`
                      : 'Up to 20 MB, text-based PDFs only'}
                  </p>
                </div>
                {formData.sourceFileName && !isParsing && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.preventDefault()
                      setFormData((prev) => ({
                        ...prev,
                        sourceFileName: '',
                        parsedText: '',
                      }))
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                    aria-label="Clear PDF"
                  >
                    <X size={16} />
                  </motion.button>
                )}
                <input
                  id="curriculum-pdf"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handlePdfUpload}
                />
              </label>

              {!formData.parsedText && (
                <TextArea
                  label="Or paste curriculum text"
                  placeholder="Paste this term's topics, objectives, and scope for one subject..."
                  rows={8}
                  value={formData.pasteText}
                  onChange={(e) => setFormData({ ...formData, pasteText: e.target.value })}
                  helpText="One term × one subject keeps the AI focused on what you're actually teaching"
                />
              )}

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-2xl text-sm text-red-600">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              icon={<CheckCircle size={20} />}
              disabled={isParsing}
            >
              {editing ? 'Update Curriculum' : 'Save to Library'}
            </Button>
          </form>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
          <Library size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Curriculum</h2>
          <p className="text-sm text-slate-500">
            Add one term per subject — smaller chunks are easier to manage and reuse
          </p>
        </div>
      </div>

      <Button
        onClick={() => setShowForm(true)}
        className="w-full"
        size="lg"
        icon={<Plus size={20} />}
      >
        Add Curriculum
      </Button>

      {curricula?.length === 0 && (
        <Card className="text-center py-12" hover={false}>
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Library size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-medium text-slate-600">No curricula yet</p>
          <p className="text-slate-400 mt-1">
            Start with one subject for this term — e.g., Term 1 Mathematics, Primary 4.
          </p>
        </Card>
      )}

      <AnimatePresence>
        <div className="space-y-4">
          {curricula?.map((c, index) => {
            const subjectLabel =
              SUBJECTS.find((s) => s.value === c.subject)?.label ?? c.subject
            const countryLabel =
              COUNTRY_PRESETS.find((p) => p.code === c.country)?.name ?? c.country
            const preview = c.parsedText.slice(0, PREVIEW_CHARS)
            return (
              <Card key={c.id} delay={index}>
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setViewing(c)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold uppercase tracking-wide">
                      <FileText size={12} />
                      {countryLabel} · {subjectLabel} · {c.grade}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-lg mt-1 truncate">
                      {c.title}
                    </h3>
                    {c.sourceFileName && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        From: {c.sourceFileName}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-3 line-clamp-3 leading-relaxed">
                      {preview}
                      {c.parsedText.length > PREVIEW_CHARS ? '…' : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {c.parsedText.length.toLocaleString()} characters
                    </p>
                  </button>
                  <div className="flex flex-col gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setViewing(c)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      aria-label="View curriculum"
                    >
                      <Eye size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleStartEdit(c)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                      aria-label="Edit curriculum"
                    >
                      <Pencil size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(c.id, c.title)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                      aria-label="Delete curriculum"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateScheme(c)}
                    icon={<CalendarRange size={16} />}
                    className="flex-1 min-w-[160px]"
                  >
                    Create Scheme of Work
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateLesson(c)}
                    icon={<BookOpen size={16} />}
                    className="flex-1 min-w-[160px]"
                  >
                    Create Lesson
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  )
}

interface CurriculumDetailViewProps {
  curriculum: Curriculum
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onCreateScheme: () => void
  onCreateLesson: () => void
}

function CurriculumDetailView({
  curriculum,
  onBack,
  onEdit,
  onDelete,
  onCreateScheme,
  onCreateLesson,
}: CurriculumDetailViewProps) {
  const subjectLabel =
    SUBJECTS.find((s) => s.value === curriculum.subject)?.label ?? curriculum.subject
  const countryLabel =
    COUNTRY_PRESETS.find((p) => p.code === curriculum.country)?.name ?? curriculum.country
  const levelLabel = LEVELS.find((l) => l.value === curriculum.level)?.label ?? curriculum.level

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={20} />}>
        Back
      </Button>

      <Card hover={false} className="bg-emerald-50/40 border-emerald-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Library size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {countryLabel} · {subjectLabel} · {curriculum.grade}
            </div>
            <h2 className="text-xl font-bold text-slate-800 mt-1 break-words">
              {curriculum.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{levelLabel}</p>
            {curriculum.sourceFileName && (
              <p className="text-xs text-slate-500 mt-1 truncate">
                Source: {curriculum.sourceFileName}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              {curriculum.parsedText.length.toLocaleString()} characters
            </p>
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-slate-500" />
          <h3 className="text-base font-semibold text-slate-800">Curriculum Text</h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-slate-50 p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
            {curriculum.parsedText}
          </pre>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={onEdit}
          icon={<Pencil size={18} />}
          className="flex-1 min-w-[140px]"
        >
          Update
        </Button>
        <Button
          variant="outline"
          onClick={onDelete}
          icon={<Trash2 size={18} />}
          className="flex-1 min-w-[140px]"
        >
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onCreateScheme}
          icon={<CalendarRange size={18} />}
          className="flex-1 min-w-[160px]"
        >
          Create Scheme of Work
        </Button>
        <Button
          onClick={onCreateLesson}
          icon={<BookOpen size={18} />}
          className="flex-1 min-w-[160px]"
        >
          Create Lesson
        </Button>
      </div>
    </motion.div>
  )
}
