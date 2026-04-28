import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Settings, Download, CheckCircle, AlertCircle, Globe, Palette, GraduationCap, MapPin, LifeBuoy } from 'lucide-react'
import { Button, Card, Input, Select } from '../components/ui'
import { useModel } from '../hooks/useModel'
import { getSettings, saveSettings } from '../lib/db'
import { COUNTRY_PRESETS, getCountryPreset } from '../lib/local-context'
import type { AppSettings, EducationLevel } from '../types'
import SupportForm from '../components/SupportForm'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French (Francais)' },
  { value: 'sw', label: 'Swahili (Kiswahili)' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'ha', label: 'Hausa' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo' },
  { value: 'ar', label: 'Arabic' },
]

const LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'primary', label: 'Primary School Teacher' },
  { value: 'secondary', label: 'Secondary School Teacher' },
  { value: 'tertiary', label: 'University/Polytechnic Lecturer' },
]

const THEMES = [
  { value: 'system', label: 'Use Phone Setting' },
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
]

const COUNTRY_OPTIONS = COUNTRY_PRESETS.map((c) => ({ value: c.code, label: c.name }))

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const { isReady, status, progress, error, retry } = useModel()
  const isDownloading = status === 'downloading'

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleChange = async (key: keyof AppSettings, value: string) => {
    if (!settings) return
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    await saveSettings(updated)
  }

  const handleCountryChange = async (code: string) => {
    if (!settings) return
    const preset = getCountryPreset(code)
    const updated: AppSettings = {
      ...settings,
      country: code,
      localLanguage: preset?.commonLanguages[0] ?? settings.localLanguage,
    }
    setSettings(updated)
    await saveSettings(updated)
  }

  const languageOptions = useMemo(() => {
    const preset = getCountryPreset(settings?.country)
    const langs = preset?.commonLanguages ?? []
    return [
      { value: '', label: 'None / English only' },
      ...langs.map((l) => ({ value: l, label: l })),
    ]
  }, [settings?.country])

  const currentPreset = getCountryPreset(settings?.country)

  const handleDownloadModel = async () => {
    retry()
    await saveSettings({ modelDownloaded: true })
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="loading loading-spinner loading-lg text-teal-500" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl icon-blue flex items-center justify-center">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-sm text-slate-500">Customize your experience</p>
        </div>
      </div>

      <Card title="AI Model" subtitle="Download the AI to work offline" delay={0}>
        <div className="space-y-4">
          {isReady ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-teal-50 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <CheckCircle size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-teal-700">AI Model Ready!</p>
                <p className="text-sm text-teal-600">Gemma 4 is ready to generate content</p>
              </div>
            </motion.div>
          ) : isDownloading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="loading loading-spinner text-teal-500" />
                <span className="text-slate-600">Downloading AI model...</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-slate-500">{Math.round(progress)}% complete</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl">
                <AlertCircle size={24} className="text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700">AI not downloaded yet</p>
                  <p className="text-sm text-amber-600">Download to use offline</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Download the AI model (~1GB) to use the app offline. Make sure you have a good
                internet connection and enough storage space.
              </p>
              <Button
                onClick={handleDownloadModel}
                icon={<Download size={20} />}
                className="w-full"
                size="lg"
              >
                Download AI Model
              </Button>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card title="Your Preferences" delay={1}>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl icon-pink flex items-center justify-center flex-shrink-0 mt-6">
              <GraduationCap size={20} />
            </div>
            <div className="flex-1">
              <Select
                label="I teach at"
                options={LEVELS}
                value={settings.educationLevel}
                onChange={(e) => handleChange('educationLevel', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl icon-amber flex items-center justify-center flex-shrink-0 mt-6">
              <Globe size={20} />
            </div>
            <div className="flex-1">
              <Select
                label="App Language"
                options={LANGUAGES}
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                helpText="More languages coming soon!"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl icon-blue flex items-center justify-center flex-shrink-0 mt-6">
              <Palette size={20} />
            </div>
            <div className="flex-1">
              <Select
                label="Theme"
                options={THEMES}
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Local Context"
        subtitle="Make AI content culturally relevant"
        delay={2}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl icon-teal flex items-center justify-center flex-shrink-0 mt-6">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <Select
                label="Country"
                options={COUNTRY_OPTIONS}
                value={settings.country ?? ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                helpText="AI will use local examples, currency, and exam boards"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl icon-blue flex items-center justify-center flex-shrink-0 mt-6">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <Input
                label="Region or State (optional)"
                placeholder="e.g., Lagos, Nairobi, Western Cape"
                value={settings.region ?? ''}
                onChange={(e) => handleChange('region', e.target.value)}
              />
            </div>
          </div>

          {currentPreset && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl icon-amber flex items-center justify-center flex-shrink-0 mt-6">
                <Globe size={20} />
              </div>
              <div className="flex-1">
                <Select
                  label="Local Language for Examples"
                  options={languageOptions}
                  value={settings.localLanguage ?? ''}
                  onChange={(e) => handleChange('localLanguage', e.target.value)}
                  helpText="Used for greetings and examples in lesson plans"
                />
              </div>
            </div>
          )}

          {currentPreset && (
            <div className="p-4 bg-teal-50 rounded-2xl text-sm text-teal-700 leading-relaxed">
              <p className="font-medium">
                Money examples will use {currentPreset.currency.name} ({currentPreset.currency.symbol})
              </p>
              {currentPreset.examBoards && currentPreset.examBoards.length > 0 && (
                <p className="text-teal-600 mt-1">
                  Assessments aligned with {currentPreset.examBoards.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card title="Get help" subtitle="Report a bug or ask the team a question" delay={3}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <LifeBuoy size={20} />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              Something not working, or there's a feature you wish KaratuAI had? Send us a note and a real human will reply.
            </p>
            <Button
              onClick={() => setSupportOpen(true)}
              variant="outline"
              icon={<LifeBuoy size={18} />}
            >
              Contact support
            </Button>
          </div>
        </div>
      </Card>

      <SupportForm open={supportOpen} onClose={() => setSupportOpen(false)} />

      <Card title="About KaratuAI" delay={4}>
        <div className="text-slate-500 space-y-3 text-sm leading-relaxed">
          <p className="text-slate-700 font-medium">Version 1.0.0</p>
          <p>
            KaratuAI Teacher's Companion helps African teachers create lesson plans, activities,
            and assessments using AI that works completely offline on your device.
          </p>
          <p className="text-xs text-slate-400">
            Powered by Google Gemma 4 &bull; Made with love for African educators
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
