import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Globe,
  Smartphone,
  Download,
  ArrowRight,
  WifiOff,
  Shield,
  HeartHandshake,
} from 'lucide-react'
import { detectDevice } from '../lib/device'

const ANDROID_APK_URL =
  'https://storage.googleapis.com/karatuai-models/apks/karatuai-android-v1.0.0.apk'

const FADE_UP = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }
const FADE_UP_SLOW = { ...FADE_UP, transition: { delay: 0.15 } }
const FADE_UP_SLOWER = { ...FADE_UP, transition: { delay: 0.3 } }
const FADE_UP_SLOWEST = { ...FADE_UP, transition: { delay: 0.45 } }

function WebButton() {
  return (
    <Link
      to="/curriculum"
      className="group flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
    >
      <Globe size={20} />
      <span>Use in your browser</span>
      <ArrowRight
        size={18}
        className="transition-transform group-hover:translate-x-1"
      />
    </Link>
  )
}

function AndroidButton() {
  const enabled = ANDROID_APK_URL.length > 0
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 w-full px-4 py-4 rounded-2xl bg-slate-100 text-slate-400">
        <Download size={20} />
        <span className="text-sm font-semibold">Android app</span>
        <span className="text-xs">Coming soon</span>
      </div>
    )
  }
  return (
    <a
      href={ANDROID_APK_URL}
      download
      className="group flex flex-col items-center justify-center gap-1 w-full px-4 py-4 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
    >
      <Download size={20} />
      <span className="text-sm font-semibold">Android app</span>
      <span className="text-xs text-emerald-600">Download APK</span>
    </a>
  )
}

function IPhoneButton() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full px-4 py-4 rounded-2xl bg-slate-100 text-slate-400">
      <Smartphone size={20} />
      <span className="text-sm font-semibold">iPhone app</span>
      <span className="text-xs">Coming soon</span>
    </div>
  )
}

const features = [
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'Once the AI loads, no internet needed. Plan lessons anywhere.',
  },
  {
    icon: Shield,
    title: 'Your data stays private',
    body: 'The AI runs on your device. Nothing you type leaves your phone.',
  },
  {
    icon: HeartHandshake,
    title: 'Free to use',
    body: 'No subscriptions, no API costs. Built for African teachers.',
  },
]

export default function LandingPage() {
  const device = useMemo(() => detectDevice(), [])

  const recommendation = (() => {
    if (device === 'ios') {
      return {
        title: 'KaratuAI on iPhone',
        body: 'The on-device AI needs more memory than iPhone browsers allow. We are building a native iPhone app — until then, please use the web version on a laptop or an Android phone.',
      }
    }
    if (device === 'android') {
      return {
        title: 'Get the best experience',
        body: 'On Android, the app works in the browser today. The dedicated Android app is coming soon for an even smoother experience.',
      }
    }
    return {
      title: 'Ready when you are',
      body: 'KaratuAI runs in your browser — no install, nothing to set up. The mobile apps are on the way.',
    }
  })()

  const showWebButton = device !== 'ios'

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-6 py-10 sm:py-16">
        <motion.header
          {...FADE_UP}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">KaratuAI</h1>
            <p className="text-xs text-slate-500">Teacher's Companion</p>
          </div>
        </motion.header>

        <motion.section {...FADE_UP_SLOW} className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-4">
            AI that helps you plan lessons,{' '}
            <span className="text-teal-600">right on your device.</span>
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Generate schemes of work, lesson plans, classroom activities, and
            assessments — all powered by an AI that runs offline on your phone
            or laptop.
          </p>
        </motion.section>

        <motion.section
          {...FADE_UP_SLOWER}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 mb-12"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {recommendation.title}
          </h3>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {recommendation.body}
          </p>

          {showWebButton && (
            <div className="mb-6">
              <WebButton />
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {showWebButton ? 'Or get the app' : 'Get the app'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <AndroidButton />
              <IPhoneButton />
            </div>
          </div>
        </motion.section>

        <motion.section {...FADE_UP_SLOWEST}>
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Why on-device AI?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-100 p-5"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Icon size={20} />
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <footer className="mt-16 text-center text-xs text-slate-400">
          Built for African teachers. Powered by Gemma running on your device.
        </footer>
      </div>
    </div>
  )
}
