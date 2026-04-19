import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
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
  const [showForm, setShowForm] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
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

    const existing = await findCurriculum({
      country: formData.country,
      level: formData.level as EducationLevel,
      subject: formData.subject as Subject,
      grade: formData.grade,
    })

    if (existing && !confirm(
      `A curriculum already exists for ${countryLabel} ${subjectLabel} ${formData.grade}. Replace it?`,
    )) {
      return
    }

    const curriculum: Curriculum = {
      id: existing?.id ?? crypto.randomUUID(),
      country: formData.country,
      level: formData.level as EducationLevel,
      subject: formData.subject as Subject,
      grade: formData.grade,
      title: formData.title.trim() || autoTitle,
      sourceFileName: formData.sourceFileName || undefined,
      pasteText: formData.parsedText ? undefined : formData.pasteText.trim(),
      parsedText: text,
      createdAt: existing?.createdAt ?? new Date(),
    }

    await saveCurriculum(curriculum)
    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Remove "${title}" from your library?`)) {
      await deleteCurriculum(id)
    }
  }

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Add Curriculum</h2>
          <Button
            variant="ghost"
            onClick={() => {
              resetForm()
              setShowForm(false)
            }}
          >
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
              placeholder="Auto-generated if left blank"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Curriculum Source
              </label>
              <p className="text-sm text-slate-500">
                Upload the official PDF or paste the text. Either is fine.
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
                  placeholder="Paste topics, objectives, scope and sequence..."
                  rows={8}
                  value={formData.pasteText}
                  onChange={(e) => setFormData({ ...formData, pasteText: e.target.value })}
                  helpText="Useful when the curriculum is online or in a Word doc"
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
              Save to Library
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
          <h2 className="text-2xl font-bold text-slate-800">Curriculum Library</h2>
          <p className="text-sm text-slate-500">
            Upload official curricula once, reuse them in every lesson and scheme
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
            Add your country's official syllabus to get aligned lessons.
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
                  <div className="flex-1 min-w-0">
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
                  </div>
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
              </Card>
            )
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  )
}
