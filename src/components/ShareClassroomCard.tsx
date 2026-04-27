import { useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react'
import { COUNTRY_PRESETS } from '../lib/local-context'
import {
  CLASSROOM_EDUCATION_LEVELS,
  type ClassroomEducationLevel,
  markClassroomDismissed,
  markClassroomShared,
  submitClassroomInfo,
} from '../lib/share-classroom'

const SUBJECT_OPTIONS = [
  'Mathematics',
  'English',
  'Science',
  'Social studies',
  'Civic education',
  'Agriculture',
  'Computer science',
  'Business studies',
  'Creative arts',
  'Physical education',
  'Religious studies',
  'Local language',
  'French',
  'Arabic',
] as const

const APP_VERSION = '1.2.0'

type Variant = 'inline' | 'modal'

interface ShareClassroomCardProps {
  variant?: Variant
  open?: boolean
  onClose?: () => void
}

export default function ShareClassroomCard({
  variant = 'inline',
  open = true,
  onClose,
}: ShareClassroomCardProps) {
  if (variant === 'modal') {
    return <ModalShell open={open} onClose={onClose}><FormBody onClose={onClose} variant={variant} /></ModalShell>
  }
  return <InlineShell><FormBody variant={variant} /></InlineShell>
}

function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose?: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function InlineShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/40">
      <div className="max-w-3xl mx-auto px-6">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          {children}
        </div>
      </div>
    </section>
  )
}

function FormBody({
  variant,
  onClose,
}: {
  variant: Variant
  onClose?: () => void
}) {
  const formId = useId()
  const [country, setCountry] = useState('')
  const [educationLevel, setEducationLevel] = useState<ClassroomEducationLevel | ''>('')
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => country.trim() !== '' && educationLevel !== '' && selectedSubjects.size > 0 && !submitting,
    [country, educationLevel, selectedSubjects, submitting],
  )

  function toggleSubject(s: string) {
    setSelectedSubjects((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await submitClassroomInfo(
        {
          country,
          educationLevel: educationLevel as ClassroomEducationLevel,
          subjects: Array.from(selectedSubjects),
          email: email.trim() || undefined,
        },
        APP_VERSION,
      )
      markClassroomShared()
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(`We couldn't save that just now (${msg}). Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDismiss() {
    markClassroomDismissed()
    onClose?.()
  }

  if (submitted) {
    return (
      <div className="p-8 sm:p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Thank you</h3>
        <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
          You just helped us understand who KaratuAI is reaching. It makes a
          real difference when we talk to sponsors and curriculum partners.
        </p>
        {variant === 'modal' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to the app
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-sm shadow-teal-500/30">
          <Sparkles size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 text-balance">
            Tell us about your classroom
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            KaratuAI is free and open source. Knowing roughly who uses it
            helps us prove impact to sponsors and pick the right features
            next. Nothing you teach with the app is sent anywhere — only
            what you choose to share below.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="Country" htmlFor={`${formId}-country`} required>
          <select
            id={`${formId}-country`}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          >
            <option value="">Select your country…</option>
            {COUNTRY_PRESETS.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </Field>

        <Field label="Education level you teach" required>
          <div className="flex flex-wrap gap-2">
            {CLASSROOM_EDUCATION_LEVELS.map(({ value, label }) => {
              const active = educationLevel === value
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setEducationLevel(value)}
                  className={
                    active
                      ? 'px-3.5 py-2 rounded-full text-sm font-medium bg-teal-500 text-white border border-teal-500'
                      : 'px-3.5 py-2 rounded-full text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:border-teal-300'
                  }
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Subjects you teach" required>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((s) => {
              const active = selectedSubjects.has(s)
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={
                    active
                      ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 text-white border border-emerald-500'
                      : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:border-emerald-300'
                  }
                >
                  {s}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Email (optional)" htmlFor={`${formId}-email`}>
          <input
            id={`${formId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.example"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Only if you want occasional product updates. We will never share or sell it.
          </p>
        </Field>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-teal-600" />
          <p className="leading-relaxed">
            Your students, lesson notes, and anything you generate in the app
            stay on your device. Only the answers above are sent.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          {variant === 'modal' && (
            <button
              type="button"
              onClick={handleDismiss}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-2"
            >
              Maybe later
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitting ? 'Sending…' : 'Share with the team'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-800 mb-2"
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

