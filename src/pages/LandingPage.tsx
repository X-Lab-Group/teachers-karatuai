import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Globe,
  Smartphone,
  Download,
  ArrowRight,
  WifiOff,
  ShieldCheck,
  HeartHandshake,
  FolderOpen,
  Wifi,
  CheckCircle2,
  Cpu,
  BookOpen,
  ClipboardCheck,
  CalendarRange,
  Lightbulb,
  ArrowUpRight,
  Code,
  Star,
  Users,
  Mail,
  School,
  Coffee,
  Building2,
} from 'lucide-react'
import { detectDevice, type DeviceKind } from '../lib/device'
import Logo from '../components/Logo'
import ShareClassroomCard from '../components/ShareClassroomCard'
import { hasInteractedWithClassroomForm } from '../lib/share-classroom'

// Lucide v1 dropped brand icons, but the GitHub mark is recognizable enough
// that an inline SVG carries more meaning here than a generic git-branch glyph.
function GithubIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.38s1.95.13 2.86.38c2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  )
}

const ANDROID_APK_URL =
  'https://storage.googleapis.com/karatuai-models/apks/karatuai-android-v1.2.4.apk'
const ANDROID_APK_VERSION = '1.2.4'
const ANDROID_APK_SIZE = '3.9 MB'
const GITHUB_URL = 'https://github.com/X-Lab-Group/teachers-karatuai'
const CONTACT_EMAIL = 'info@karatuai.com'

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const },
}

function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div className="absolute -top-40 -left-32 w-[680px] h-[680px] rounded-full bg-teal-200/40 blur-3xl" />
      <div className="absolute -top-20 right-0 w-[520px] h-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="absolute top-[420px] left-1/3 w-[420px] h-[420px] rounded-full bg-sky-200/30 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
    </div>
  )
}

function TopNav() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 80], [0, 1])
  return (
    <header className="sticky top-0 z-40">
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-white/70 backdrop-blur-md border-b border-slate-200/60"
      />
      <div className="relative max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-bold text-slate-900 tracking-tight">KaratuAI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
          <a href="#open-source" className="hover:text-slate-900 transition-colors">Open source</a>
          <a href="#sponsor" className="hover:text-slate-900 transition-colors">Sponsor</a>
          <a href="#download" className="hover:text-slate-900 transition-colors">Download</a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <GithubIcon size={16} />
            <span>GitHub</span>
          </a>
          <a
            href="#download"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Get the app
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </header>
  )
}

function Hero({ device, onDownloadClick }: { device: DeviceKind; onDownloadClick: () => void }) {
  const showWeb = device !== 'ios'
  return (
    <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32">
      <GradientBackdrop />
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          {...fadeIn}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700 transition-colors mb-8"
        >
          <span className="flex items-center gap-1 text-teal-600">
            <Star size={12} className="fill-current" />
            <span className="font-semibold">Open source</span>
          </span>
          <span className="w-px h-3 bg-slate-300" />
          <span>v{ANDROID_APK_VERSION} just shipped</span>
          <ArrowUpRight size={12} className="text-slate-400" />
        </motion.a>

        <motion.h1
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.05 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight text-balance leading-[1.05]"
        >
          AI lesson planning
          <br />
          <span className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            that lives on your phone.
          </span>
        </motion.h1>

        <motion.p
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.15 }}
          className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto text-pretty"
        >
          Generate schemes of work, lesson plans, classroom activities, and
          assessments — entirely offline, completely private, free forever.
          Built for teachers across Africa.
        </motion.p>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.25 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {showWeb && (
            <Link
              to="/curriculum"
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all"
            >
              <Globe size={18} />
              <span>Open in browser</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <button
            onClick={onDownloadClick}
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold shadow-sm hover:border-slate-300 hover:-translate-y-0.5 transition-all"
          >
            <Download size={18} />
            <span>{device === 'android' ? 'Download for Android' : 'Get the mobile app'}</span>
          </button>
        </motion.div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.35 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-teal-500" />
            Works offline
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-teal-500" />
            No account needed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-teal-500" />
            MIT licensed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-teal-500" />
            Powered by Gemma
          </span>
        </motion.div>
      </div>

      <ProductPreview />
    </section>
  )
}

function ProductPreview() {
  return (
    <motion.div
      {...fadeIn}
      transition={{ ...fadeIn.transition, delay: 0.45 }}
      className="relative max-w-3xl mx-auto px-6 mt-20"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-teal-200/30 via-emerald-200/20 to-sky-200/30 rounded-[2rem] blur-2xl -z-10" />
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="ml-3 text-xs font-medium text-slate-500">
            Lesson plan · Grade 5 Science
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-teal-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            On-device
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-5 text-left">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-1.5">
              Topic
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Photosynthesis: how plants make their own food
            </h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-2">
              Learning objectives
            </p>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="text-teal-500 mt-1">•</span>
                Identify the role of sunlight, water, and air in plant growth.
              </li>
              <li className="flex gap-2">
                <span className="text-teal-500 mt-1">•</span>
                Explain why plants need leaves and roots.
              </li>
              <li className="flex gap-2">
                <span className="text-teal-500 mt-1">•</span>
                Predict what happens when a plant is kept in the dark.
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-2">
              Classroom activity
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              Place two bean seedlings in jars — one near a sunny window, the
              other inside a covered box. Have learners observe and sketch
              them daily for a week, then discuss what they noticed.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
            <span>Generated in 4.2s · 0 cloud calls</span>
            <span className="flex items-center gap-1">
              <Cpu size={12} /> Gemma running locally
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const differentiators = [
  {
    icon: WifiOff,
    title: 'Works completely offline',
    body: 'Once the AI is downloaded, plan a full term of lessons with no internet at all. Useful when the WiFi at school is patchy — or absent.',
    accent: 'from-teal-500 to-teal-600',
  },
  {
    icon: ShieldCheck,
    title: 'Your students stay private',
    body: "Everything you type — student names, school details, lesson notes — never leaves your device. Nothing is sent to a server. There's no server.",
    accent: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: HeartHandshake,
    title: 'Free, with no asterisks',
    body: 'No subscriptions, no API costs, no usage limits, no ads. Built as a public good for African educators and released under the MIT license.',
    accent: 'from-emerald-500 to-emerald-600',
  },
] as const

function Differentiators() {
  return (
    <section id="features" className="relative py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeIn} className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-3">
            Built differently
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Most AI tools assume cheap data and fast WiFi. We don&apos;t.
          </h2>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {differentiators.map(({ icon: Icon, title, body, accent }, i) => (
            <motion.div
              key={title}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.08 }}
              className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:-translate-y-1 transition-all"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm mb-5`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const useCases = [
  {
    icon: CalendarRange,
    label: 'Schemes of work',
    body: 'A full term mapped out by week — topics, objectives, suggested resources.',
  },
  {
    icon: BookOpen,
    label: 'Lesson plans',
    body: 'Introduction, main content, examples, and closing activity for one period.',
  },
  {
    icon: Lightbulb,
    label: 'Classroom activities',
    body: 'Hands-on group work, role plays, and demonstrations using local materials.',
  },
  {
    icon: ClipboardCheck,
    label: 'Tests and assessments',
    body: 'Multiple-choice, short answer, and open-ended questions with mark schemes.',
  },
] as const

function UseCases() {
  return (
    <section className="relative py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeIn} className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-3">
            What you can create
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Four kinds of teaching material, generated in seconds.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {useCases.map(({ icon: Icon, label, body }, i) => (
            <motion.div
              key={label}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.06 }}
              className="group flex gap-4 p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all"
            >
              <div className="shrink-0 w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{label}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    title: 'Pick what you need',
    body: 'Choose a scheme of work, a single lesson, an activity, or an assessment.',
  },
  {
    title: 'Tell the AI about your class',
    body: "Subject, grade, topic, and how long the lesson should run. That\u2019s it.",
  },
  {
    title: 'Get a complete plan',
    body: 'Edit it in the app, save it for later, or print it out. The AI never leaves your device.',
  },
] as const

function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeIn} className="max-w-2xl mb-14">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Three steps from cold start to a complete lesson plan.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ title, body }, i) => (
            <motion.div
              key={title}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.08 }}
              className="relative"
            >
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-teal-600 mb-4">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function OpenSourceStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu
  label: string
  value: string
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
      <Icon size={18} className="text-teal-400 mb-3" />
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  )
}

function OpenSourceSection() {
  return (
    <section id="open-source" className="relative py-20 sm:py-28 bg-slate-900 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,184,166,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_50%)]" />
      </div>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3">
            <p className="text-xs uppercase tracking-widest font-semibold text-teal-400 mb-3">
              Open source
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance mb-5">
              Built in the open. Audit the code, fork it, ship it.
            </h2>
            <p className="text-slate-300 leading-relaxed mb-8 max-w-xl">
              Every line of KaratuAI is on GitHub under the MIT license. If a
              ministry of education wants to deploy a branded version for their
              country, the path is clone, customize, ship — no licensing calls,
              no procurement.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
              >
                <GithubIcon size={18} />
                <span>View on GitHub</span>
                <ArrowUpRight
                  size={16}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
              <a
                href={`${GITHUB_URL}/issues`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
              >
                <Code size={18} />
                <span>Report an issue</span>
              </a>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <OpenSourceStat icon={Cpu} label="Runs entirely" value="On device" />
              <OpenSourceStat icon={ShieldCheck} label="License" value="MIT" />
              <OpenSourceStat icon={Users} label="Built for" value="Teachers" />
              <OpenSourceStat icon={HeartHandshake} label="Cost" value="Free" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const sponsorTiers = [
  {
    icon: Coffee,
    name: 'Friend',
    pitch: 'Cover server bandwidth for a few teachers',
    body: 'Help offset the cost of hosting the AI model and serving it to teachers in low-bandwidth regions.',
    accent: 'from-teal-50 to-white',
    border: 'border-teal-100',
    iconBg: 'bg-teal-100 text-teal-700',
  },
  {
    icon: School,
    name: 'School patron',
    pitch: 'Fund a feature your teachers need',
    body: 'Sponsor a specific capability — a new subject pack, a local-language interface, or a custom curriculum import.',
    accent: 'from-emerald-50 to-white',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Building2,
    name: 'Partner',
    pitch: 'Deploy a branded version country-wide',
    body: 'Ministries, NGOs, and foundations: we will work with you to ship a localized build at the scale you need.',
    accent: 'from-indigo-50 to-white',
    border: 'border-indigo-100',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
] as const

function SponsorshipSection() {
  return (
    <section id="sponsor" className="relative py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div {...fadeIn} className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-3">
            Sponsorship
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Help keep KaratuAI free for every teacher.
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            KaratuAI is built as a public good — no subscriptions, no ads, no
            data harvesting. Sponsorships pay for the bandwidth that delivers
            the AI to teachers, and the engineering time that keeps it
            improving.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {sponsorTiers.map(({ icon: Icon, name, pitch, body, accent, border, iconBg }, i) => (
            <motion.div
              key={name}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.08 }}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${accent} border ${border} hover:-translate-y-1 transition-all`}
            >
              <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-5`}>
                <Icon size={20} />
              </div>
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">
                {name}
              </p>
              <h3 className="font-bold text-slate-900 mb-2 text-balance">{pitch}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.25 }}
          className="mt-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative"
        >
          <div aria-hidden className="absolute inset-0 -z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(20,184,166,0.18),transparent_55%)]" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-widest font-semibold text-teal-400 mb-2">
                Get in touch
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance mb-3">
                Want to sponsor or partner with us?
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Tell us about your school, ministry, or foundation. We will
                reply within two working days with what is possible and how we
                would structure it.
              </p>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=KaratuAI%20sponsorship%20enquiry`}
              className="group inline-flex items-center justify-center gap-2 shrink-0 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
            >
              <Mail size={18} />
              <span>{CONTACT_EMAIL}</span>
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const installSteps = [
  {
    icon: FolderOpen,
    title: 'Open the file once it downloads',
    body: 'Tap the notification, or find the APK in your Downloads folder.',
  },
  {
    icon: ShieldCheck,
    title: 'Allow install from this source',
    body: 'Android will ask the first time. Tap "Settings" then enable the toggle. This is normal for any app outside the Play Store.',
  },
  {
    icon: CheckCircle2,
    title: 'If Play Protect warns you, tap "Install anyway"',
    body: 'Google has not seen our app yet, so it shows a caution. We will be on the Play Store soon.',
  },
  {
    icon: Wifi,
    title: 'First launch downloads the AI on WiFi',
    body: 'About 1.9 GB, one time only. After that the app runs offline.',
  },
] as const

function AndroidDownloadCard({ onDownload }: { onDownload: () => void }) {
  return (
    <a
      href={ANDROID_APK_URL}
      onClick={onDownload}
      className="group flex items-center justify-between gap-4 w-full px-5 py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
          <Download size={20} />
        </div>
        <div className="text-left">
          <div>Download for Android</div>
          <div className="text-xs font-normal text-emerald-50">
            v{ANDROID_APK_VERSION} · {ANDROID_APK_SIZE} APK
          </div>
        </div>
      </div>
      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
    </a>
  )
}

function InstallStepsPanel({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mt-4 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-4">
              What happens next
            </p>
            <ol className="space-y-4">
              {installSteps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-200">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon size={14} className="text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-800">{title}</p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DesktopAndroidCard() {
  return (
    <div className="flex gap-4 p-5 rounded-2xl bg-white border border-emerald-100">
      <div className="shrink-0 p-2.5 bg-white rounded-xl border border-emerald-200">
        <QRCodeSVG value={ANDROID_APK_URL} size={96} level="M" marginSize={0} />
      </div>
      <div className="min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
          <Download size={16} />
          <span className="text-sm">Android · v{ANDROID_APK_VERSION}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Point your Android phone&apos;s camera at this code to download the
          APK ({ANDROID_APK_SIZE}).
        </p>
      </div>
    </div>
  )
}

function IPhoneNote() {
  return (
    <div className="flex items-start gap-3 p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900">
      <Smartphone size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm mb-0.5">iPhone app coming soon</p>
        <p className="text-xs leading-relaxed text-amber-800">
          On-device AI does not fit in iPhone browsers yet. Use a laptop or an
          Android phone today — we will announce the iPhone app the moment it
          is ready.
        </p>
      </div>
    </div>
  )
}

function DownloadSection({
  device,
  stepsRevealed,
  onAndroidDownload,
}: {
  device: DeviceKind
  stepsRevealed: boolean
  onAndroidDownload: () => void
}) {
  const showWeb = device !== 'ios'
  return (
    <section
      id="download"
      className="relative py-20 sm:py-28 bg-gradient-to-br from-teal-50 via-white to-emerald-50"
    >
      <div className="max-w-3xl mx-auto px-6">
        <motion.div {...fadeIn} className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest font-semibold text-teal-600 mb-3">
            Get started
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
            Ready to plan your next lesson?
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Choose how you want to use KaratuAI. The AI download happens once,
            then everything runs offline.
          </p>
        </motion.div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 sm:p-8"
        >
          {showWeb && (
            <div className="mb-5">
              <Link
                to="/curriculum"
                className="group flex items-center justify-between gap-4 w-full px-5 py-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    <Globe size={20} />
                  </div>
                  <div className="text-left">
                    <div>Use in your browser</div>
                    <div className="text-xs font-normal text-teal-50">
                      No install · Works on laptops and Android
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          )}

          {device === 'android' && (
            <>
              <AndroidDownloadCard onDownload={onAndroidDownload} />
              <InstallStepsPanel visible={stepsRevealed} />
            </>
          )}

          {device === 'desktop' && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">
                Or get the mobile app
              </p>
              <DesktopAndroidCard />
              <IPhoneNote />
            </div>
          )}

          {device === 'ios' && <IPhoneNote />}
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <Logo size={32} />
              <span className="font-bold text-slate-900 tracking-tight">KaratuAI</span>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              On-device AI that helps African teachers plan lessons, design
              activities, and write assessments — without internet, without
              giving up student privacy.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-4">
              Product
            </p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-slate-900 transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-slate-900 transition-colors">
                  Download
                </a>
              </li>
              <li>
                <Link to="/curriculum" className="hover:text-slate-900 transition-colors">
                  Open the app
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-4">
              Open source
            </p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 transition-colors"
                >
                  GitHub repository
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 transition-colors"
                >
                  Report an issue
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900 transition-colors"
                >
                  MIT license
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-4">
              Contact
            </p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#sponsor" className="hover:text-slate-900 transition-colors">
                  Sponsor us
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-slate-900 transition-colors break-all"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=KaratuAI%20partnership`}
                  className="hover:text-slate-900 transition-colors"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>Built for African teachers. Powered by Gemma running on your device.</p>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} KaratuAI</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              <GithubIcon size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function scrollToDownload() {
  document.getElementById('download')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function LandingPage() {
  const device = useMemo(() => detectDevice(), [])
  const [stepsRevealed, setStepsRevealed] = useState(false)
  // Read localStorage once at mount time. Doing this in an effect would cause
  // a cascading render and the classroom form would briefly flash for users
  // who already filled it in.
  const [showClassroomForm] = useState(() => !hasInteractedWithClassroomForm())

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <TopNav />
      <main>
        <Hero device={device} onDownloadClick={scrollToDownload} />
        <Differentiators />
        <UseCases />
        <HowItWorks />
        <OpenSourceSection />
        <SponsorshipSection />
        {showClassroomForm && <ShareClassroomCard variant="inline" />}
        <DownloadSection
          device={device}
          stepsRevealed={stepsRevealed}
          onAndroidDownload={() => setStepsRevealed(true)}
        />
      </main>
      <Footer />
    </div>
  )
}
