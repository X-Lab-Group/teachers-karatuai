import { useId, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, LifeBuoy, ShieldCheck, X } from 'lucide-react'
import { useModelStatus } from '../hooks/useModel'
import {
  SUPPORT_ISSUE_KINDS,
  type SupportIssueKind,
  submitSupportRequest,
} from '../lib/support'

const APP_VERSION = '1.2.2'
const SUPPORT_EMAIL = 'support@karatuai.com'

interface SupportFormProps {
  open: boolean
  onClose: () => void
}

export default function SupportForm({ open, onClose }: SupportFormProps) {
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
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
            <FormBody onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FormBody({ onClose }: { onClose: () => void }) {
  const formId = useId()
  const { status: modelStatus } = useModelStatus()
  const [kind, setKind] = useState<SupportIssueKind>('bug')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () =>
      subject.trim().length > 2 &&
      message.trim().length > 5 &&
      /.+@.+\..+/.test(email.trim()) &&
      !submitting,
    [subject, message, email, submitting],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await submitSupportRequest(
        {
          kind,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim(),
        },
        APP_VERSION,
        modelStatus,
      )
      setSubmitted(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(
        `We couldn't send that just now (${msg}). You can also email ${SUPPORT_EMAIL} directly.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-8 sm:p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Message sent</h3>
        <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
          A real human will read it and reply to{' '}
          <span className="font-semibold text-slate-800">{email}</span> within a
          couple of working days.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Back to the app
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <LifeBuoy size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 text-balance">
            Get help from the team
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tell us what's going wrong, what you wish the app did, or just ask
            a question. Your message is sent straight to{' '}
            <span className="font-medium text-slate-700">{SUPPORT_EMAIL}</span>.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <Field label="What's this about?" required>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_ISSUE_KINDS.map(({ value, label }) => {
              const active = kind === value
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setKind(value)}
                  className={
                    active
                      ? 'px-3.5 py-2 rounded-full text-sm font-medium bg-indigo-500 text-white border border-indigo-500'
                      : 'px-3.5 py-2 rounded-full text-sm font-medium bg-white text-slate-700 border border-slate-300 hover:border-indigo-300'
                  }
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Subject" htmlFor={`${formId}-subject`} required>
          <input
            id={`${formId}-subject`}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Short summary"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </Field>

        <Field label="Tell us more" htmlFor={`${formId}-message`} required>
          <textarea
            id={`${formId}-message`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What were you trying to do? What did you see instead?"
            required
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-y"
          />
        </Field>

        <Field label="Your email" htmlFor={`${formId}-email`} required>
          <input
            id={`${formId}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.example"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            We need this so we can reply to you. Used only for this conversation.
          </p>
        </Field>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-indigo-600" />
          <p className="leading-relaxed">
            We'll attach the app version, your platform, and browser info to
            help us reproduce issues. Your lesson plans and student notes stay
            on your device.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitting ? 'Sending…' : 'Send to support'}
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
