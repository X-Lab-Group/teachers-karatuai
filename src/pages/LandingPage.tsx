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
  'https://storage.googleapis.com/karatuai-models/apks/karatuai-android-v1.2.8.apk'
const ANDROID_APK_VERSION = '1.2.8'
const ANDROID_APK_SIZE = '3.9 MB'
const GITHUB_URL = 'https://github.com/X-Lab-Group/teachers-karatuai'
const CONTACT_EMAIL = 'info@karatuai.com'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] as const },
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-brand">
      {children}
    </p>
  )
}

function TopNav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 40], [0, 1])
  return (
    <header className="sticky top-0 z-40 bg-white">
      <motion.div
        style={{ opacity: borderOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-landing-hairline"
      />
      <div className="relative mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-bold tracking-tight text-landing-ink">KaratuAI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-landing-muted md:flex">
          <a href="#features" className="transition-colors hover:text-landing-ink">
            Features
          </a>
          <a href="#how" className="transition-colors hover:text-landing-ink">
            How it works
          </a>
          <a href="#open-source" className="transition-colors hover:text-landing-ink">
            Open source
          </a>
          <a href="#sponsor" className="transition-colors hover:text-landing-ink">
            Sponsor
          </a>
          <a href="#download" className="transition-colors hover:text-landing-ink">
            Download
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-[12px] px-3 py-2 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-canvas sm:flex"
          >
            <GithubIcon size={16} />
            <span>GitHub</span>
          </a>
          <a
            href="#download"
            className="inline-flex items-center gap-1.5 rounded-[12px] bg-landing-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-landing-ink/90"
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
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_42%,rgba(12,140,126,0.06),transparent_42%)]" />
      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-14 lg:px-8 lg:pb-16 lg:pt-12">
        <div className="mx-auto flex w-full max-w-[34rem] flex-col lg:mx-0">
          <motion.a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            {...fadeIn}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-landing-brand/22 bg-landing-brand/8 px-3.5 py-1.5 text-[12px] font-semibold tracking-[0.01em] text-[#075f57] transition-colors hover:border-landing-brand/40"
          >
            Open source · v{ANDROID_APK_VERSION}
            <ArrowUpRight size={12} />
          </motion.a>

          <motion.h1
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.05 }}
            className="mt-5 text-[2.65rem] font-bold leading-[1.04] tracking-[-0.045em] text-landing-ink sm:text-[3.1rem] lg:text-[3.4rem]"
          >
            AI lesson planning{' '}
            <span className="text-landing-brand">that lives on your phone.</span>
          </motion.h1>

          <motion.p
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.12 }}
            className="mt-5 max-w-[40ch] text-[15px] leading-7 text-landing-muted sm:text-[16px]"
          >
            Generate schemes of work, lesson plans, classroom activities, and assessments —
            entirely offline, completely private, free forever. Built for teachers across Africa.
          </motion.p>

          <motion.div
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            {showWeb && (
              <Link
                to="/curriculum"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-landing-brand px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(12,140,126,0.2)] transition hover:bg-landing-brand-hover"
              >
                <Globe size={18} />
                Open in browser
                <ArrowRight size={16} />
              </Link>
            )}
            <button
              type="button"
              onClick={onDownloadClick}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-landing-brand/35 bg-white px-5 text-sm font-semibold text-landing-brand transition hover:border-landing-brand hover:bg-landing-brand/5"
            >
              <Download size={18} />
              {device === 'android' ? 'Download for Android' : 'Get the mobile app'}
            </button>
          </motion.div>

          <motion.p
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.28 }}
            className="mt-4 text-xs font-medium text-landing-muted"
          >
            Works offline · No account needed · MIT licensed
          </motion.p>
        </div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.18 }}
          className="relative mx-auto w-full max-w-[640px] lg:mx-0 lg:max-w-none"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  )
}

function ProductPreview() {
  return (
    <div className="rounded-2xl border border-landing-hairline bg-white shadow-[0_16px_40px_rgba(20,34,31,0.08)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-landing-hairline bg-landing-canvas/70 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-landing-hairline" />
          <div className="h-2.5 w-2.5 rounded-full bg-landing-hairline" />
          <div className="h-2.5 w-2.5 rounded-full bg-landing-hairline" />
        </div>
        <div className="ml-3 text-xs font-medium text-landing-muted">
          Lesson plan · Grade 5 Science
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-landing-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-landing-brand animate-pulse" />
          On-device
        </div>
      </div>
      <div className="space-y-5 p-6 text-left sm:p-8">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-landing-brand">
            Topic
          </p>
          <h3 className="text-lg font-bold text-landing-ink sm:text-xl">
            Photosynthesis: how plants make their own food
          </h3>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-landing-brand">
            Learning objectives
          </p>
          <ul className="space-y-1.5 text-sm text-landing-ink/80">
            <li className="flex gap-2">
              <span className="mt-1 text-landing-brand">•</span>
              Identify the role of sunlight, water, and air in plant growth.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-landing-brand">•</span>
              Explain why plants need leaves and roots.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 text-landing-brand">•</span>
              Predict what happens when a plant is kept in the dark.
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-landing-brand">
            Classroom activity
          </p>
          <p className="text-sm leading-relaxed text-landing-muted">
            Place two bean seedlings in jars — one near a sunny window, the other inside a covered
            box. Have learners observe and sketch them daily for a week, then discuss what they
            noticed.
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-landing-hairline pt-2 text-xs text-landing-muted">
          <span>Generated in 4.2s · 0 cloud calls</span>
          <span className="flex items-center gap-1">
            <Cpu size={12} /> Gemma running locally
          </span>
        </div>
      </div>
    </div>
  )
}

function TrustStrip() {
  const chips = ['Works offline', 'No account', 'MIT licensed', 'Powered by Gemma'] as const
  return (
    <section className="border-y border-landing-hairline bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-landing-ink">
          Built for classrooms without reliable WiFi
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-landing-hairline bg-landing-canvas px-3 py-1 text-xs font-semibold text-landing-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Chapter({
  id,
  eyebrow,
  title,
  body,
  points,
  icon: Icon,
  tone = 'white',
}: {
  id?: string
  eyebrow: string
  title: string
  body: string
  points: readonly string[]
  icon: typeof WifiOff
  tone?: 'white' | 'canvas'
}) {
  return (
    <section
      id={id}
      className={`relative py-16 sm:py-24 ${tone === 'canvas' ? 'bg-landing-canvas' : 'bg-white'}`}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-16">
          <div className="max-w-2xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight text-balance text-landing-ink sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-landing-muted sm:text-base">{body}</p>
            <ul className="mt-6 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex gap-3 text-sm text-landing-ink/85">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-landing-brand" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-landing-hairline bg-white p-10 shadow-[0_8px_24px_rgba(20,34,31,0.04)]">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-landing-hairline bg-landing-brand/8 text-landing-brand">
              <Icon size={28} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Differentiators() {
  return (
    <>
      <Chapter
        id="features"
        eyebrow="Offline first"
        title="Most AI tools assume cheap data and fast WiFi. We don't."
        body="Once the AI is downloaded, plan a full term of lessons with no internet at all. Useful when the WiFi at school is patchy — or absent."
        points={[
          'One-time ~1.9 GB model download over WiFi',
          'Then schemes, lessons, and tests run fully offline',
          'Resumable download if the connection drops',
        ]}
        icon={WifiOff}
        tone="white"
      />
      <Chapter
        eyebrow="Private by design"
        title="Your students stay on your device."
        body="Everything you type — student names, school details, lesson notes — never leaves your phone. There's no account and no inference server."
        points={[
          'On-device Gemma via WebAssembly',
          'No cloud API calls after the model is cached',
          'MIT licensed so ministries can audit and fork',
        ]}
        icon={ShieldCheck}
        tone="canvas"
      />
    </>
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
    <section className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="max-w-2xl">
          <Eyebrow>What you can create</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-landing-ink sm:text-4xl">
            Four kinds of teaching material, generated in seconds.
          </h2>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {useCases.map(({ icon: Icon, label, body }, i) => (
            <motion.div
              key={label}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.05 }}
              className="flex gap-4 rounded-2xl border border-landing-hairline bg-landing-canvas/50 p-6"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-landing-hairline bg-white text-landing-brand">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="mb-1 font-bold text-landing-ink">{label}</h3>
                <p className="text-sm leading-relaxed text-landing-muted">{body}</p>
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
    body: "Subject, grade, topic, and how long the lesson should run. That's it.",
  },
  {
    title: 'Get a complete plan',
    body: 'Edit it in the app, save it for later, or print it out. The AI never leaves your device.',
  },
] as const

function HowItWorks() {
  return (
    <section id="how" className="relative bg-landing-canvas py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="mb-14 max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-landing-ink sm:text-4xl">
            Three steps from cold start to a complete lesson plan.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(({ title, body }, i) => (
            <motion.div
              key={title}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.06 }}
              className="rounded-2xl border border-landing-hairline bg-white p-6"
            >
              <div className="mb-4 text-4xl font-bold text-landing-brand">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-2 font-bold text-landing-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-landing-muted">{body}</p>
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <Icon size={18} className="mb-3 text-landing-brand" />
      <div className="mb-0.5 text-xs text-slate-400">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  )
}

function OpenSourceSection() {
  return (
    <section id="open-source" className="relative overflow-hidden bg-landing-ink py-16 sm:py-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(12,140,126,0.18),transparent_50%)]" />
      </div>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5eead4]">
              Open source
            </p>
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
              Built in the open. Audit the code, fork it, ship it.
            </h2>
            <p className="mb-8 max-w-xl leading-relaxed text-white/70">
              Every line of KaratuAI is on GitHub under the MIT license. If a ministry of education
              wants to deploy a branded version for their country, the path is clone, customize,
              ship — no licensing calls, no procurement.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-[12px] bg-white px-5 py-3 font-semibold text-landing-ink transition-colors hover:bg-landing-canvas"
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
                className="inline-flex items-center gap-2 rounded-[12px] border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/20"
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
  },
  {
    icon: School,
    name: 'School patron',
    pitch: 'Fund a feature your teachers need',
    body: 'Sponsor a specific capability — a new subject pack, a local-language interface, or a custom curriculum import.',
  },
  {
    icon: Building2,
    name: 'Partner',
    pitch: 'Deploy a branded version country-wide',
    body: 'Ministries, NGOs, and foundations: we will work with you to ship a localized build at the scale you need.',
  },
] as const

function SponsorshipSection() {
  return (
    <section id="sponsor" className="relative bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="max-w-2xl">
          <Eyebrow>Sponsorship</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-landing-ink sm:text-4xl">
            Help keep KaratuAI free for every teacher.
          </h2>
          <p className="mt-4 leading-relaxed text-landing-muted">
            KaratuAI is built as a public good — no subscriptions, no ads, no data harvesting.
            Sponsorships pay for the bandwidth that delivers the AI to teachers, and the
            engineering time that keeps it improving.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {sponsorTiers.map(({ icon: Icon, name, pitch, body }, i) => (
            <motion.div
              key={name}
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: i * 0.06 }}
              className="rounded-2xl border border-landing-hairline bg-landing-canvas/40 p-6"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl border border-landing-hairline bg-white text-landing-brand">
                <Icon size={20} />
              </div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
                {name}
              </p>
              <h3 className="mb-2 font-bold text-balance text-landing-ink">{pitch}</h3>
              <p className="text-sm leading-relaxed text-landing-muted">{body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.2 }}
          className="relative mt-12 overflow-hidden rounded-3xl bg-landing-ink p-8 text-white sm:p-10"
        >
          <div aria-hidden className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(12,140,126,0.18),transparent_55%)]" />
          </div>
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5eead4]">
                Get in touch
              </p>
              <h3 className="mb-3 text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl">
                Want to sponsor or partner with us?
              </h3>
              <p className="leading-relaxed text-white/70">
                Tell us about your school, ministry, or foundation. We will reply within two
                working days with what is possible and how we would structure it.
              </p>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=KaratuAI%20sponsorship%20enquiry`}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-white px-6 py-3.5 font-semibold text-landing-ink transition-colors hover:bg-landing-canvas"
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
      className="group flex w-full items-center justify-between gap-4 rounded-2xl bg-landing-brand px-5 py-4 font-semibold text-white shadow-[0_10px_24px_rgba(12,140,126,0.2)] transition hover:bg-landing-brand-hover"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
          <Download size={20} />
        </div>
        <div className="text-left">
          <div>Download for Android</div>
          <div className="text-xs font-normal text-white/80">
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
          <div className="mt-4 rounded-2xl border border-landing-brand/20 bg-landing-brand/5 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-landing-brand">
              What happens next
            </p>
            <ol className="space-y-4">
              {installSteps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-landing-brand/25 bg-white text-sm font-bold text-landing-brand">
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <Icon size={14} className="text-landing-brand" />
                      <p className="text-sm font-semibold text-landing-ink">{title}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-landing-muted">{body}</p>
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
    <div className="flex gap-4 rounded-2xl border border-landing-hairline bg-white p-5">
      <div className="shrink-0 rounded-xl border border-landing-hairline bg-white p-2.5">
        <QRCodeSVG value={ANDROID_APK_URL} size={96} level="M" marginSize={0} />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-landing-brand">
          <Download size={16} />
          <span className="text-sm">Android · v{ANDROID_APK_VERSION}</span>
        </div>
        <p className="text-xs leading-relaxed text-landing-muted">
          Point your Android phone&apos;s camera at this code to download the APK ({ANDROID_APK_SIZE}
          ).
        </p>
      </div>
    </div>
  )
}

function IPhoneNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
      <Smartphone size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="mb-0.5 text-sm font-semibold">iPhone app coming soon</p>
        <p className="text-xs leading-relaxed text-amber-800">
          On-device AI does not fit in iPhone browsers yet. Use a laptop or an Android phone today —
          we will announce the iPhone app the moment it is ready.
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
    <section id="download" className="relative bg-landing-canvas py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div {...fadeIn} className="mb-12 text-center">
          <Eyebrow>Get started</Eyebrow>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-landing-ink sm:text-4xl">
            Ready to plan your next lesson?
          </h2>
          <p className="mt-4 leading-relaxed text-landing-muted">
            Choose how you want to use KaratuAI. The AI download happens once, then everything runs
            offline.
          </p>
        </motion.div>

        <motion.div
          {...fadeIn}
          transition={{ ...fadeIn.transition, delay: 0.08 }}
          className="rounded-3xl border border-landing-hairline bg-white p-6 shadow-[0_16px_40px_rgba(20,34,31,0.06)] sm:p-8"
        >
          {showWeb && (
            <div className="mb-5">
              <Link
                to="/curriculum"
                className="group flex w-full items-center justify-between gap-4 rounded-2xl bg-landing-brand px-5 py-4 font-semibold text-white shadow-[0_10px_24px_rgba(12,140,126,0.2)] transition hover:bg-landing-brand-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
                    <Globe size={20} />
                  </div>
                  <div className="text-left">
                    <div>Use in your browser</div>
                    <div className="text-xs font-normal text-white/80">
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
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-landing-muted">
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
    <footer className="border-t border-landing-hairline bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="mb-4 flex items-center gap-2.5">
              <Logo size={32} />
              <span className="font-bold tracking-tight text-landing-ink">KaratuAI</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-landing-muted">
              On-device AI that helps African teachers plan lessons, design activities, and write
              assessments — without internet, without giving up student privacy.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
              Product
            </p>
            <ul className="space-y-2.5 text-sm text-landing-muted">
              <li>
                <a href="#features" className="transition-colors hover:text-landing-ink">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="transition-colors hover:text-landing-ink">
                  How it works
                </a>
              </li>
              <li>
                <a href="#download" className="transition-colors hover:text-landing-ink">
                  Download
                </a>
              </li>
              <li>
                <Link to="/curriculum" className="transition-colors hover:text-landing-ink">
                  Open the app
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
              Open source
            </p>
            <ul className="space-y-2.5 text-sm text-landing-muted">
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-landing-ink"
                >
                  GitHub repository
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-landing-ink"
                >
                  Report an issue
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-landing-ink"
                >
                  MIT license
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-muted">
              Contact
            </p>
            <ul className="space-y-2.5 text-sm text-landing-muted">
              <li>
                <a href="#sponsor" className="transition-colors hover:text-landing-ink">
                  Sponsor us
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="break-all transition-colors hover:text-landing-ink"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=KaratuAI%20partnership`}
                  className="transition-colors hover:text-landing-ink"
                >
                  Partnerships
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-landing-hairline pt-8 text-xs text-landing-muted sm:flex-row">
          <p>Built for African teachers. Powered by Gemma running on your device.</p>
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} KaratuAI</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-landing-ink"
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
  const [showClassroomForm] = useState(() => !hasInteractedWithClassroomForm())

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  return (
    <div className="min-h-screen bg-landing-canvas text-landing-ink">
      <TopNav />
      <main>
        <Hero device={device} onDownloadClick={scrollToDownload} />
        <TrustStrip />
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
