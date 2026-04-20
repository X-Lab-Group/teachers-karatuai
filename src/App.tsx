import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ModelProvider from './contexts/ModelContext'
import ModelLoadingScreen from './components/ModelLoadingScreen'
import Layout from './components/layout/Layout'

const RELOAD_FLAG = 'karatuai:chunk-reloaded'

function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory()
      sessionStorage.removeItem(RELOAD_FLAG)
      return mod
    } catch (err) {
      if (sessionStorage.getItem(RELOAD_FLAG)) throw err
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
      return new Promise<never>(() => {})
    }
  })
}

const LessonPlannerPage = lazyWithReload(() => import('./pages/LessonPlannerPage'))
const ActivitiesPage = lazyWithReload(() => import('./pages/ActivitiesPage'))
const AssessmentsPage = lazyWithReload(() => import('./pages/AssessmentsPage'))
const SchemeOfWorkPage = lazyWithReload(() => import('./pages/SchemeOfWorkPage'))
const CurriculumLibraryPage = lazyWithReload(() => import('./pages/CurriculumLibraryPage'))
const SettingsPage = lazyWithReload(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <ModelProvider>
      <ModelLoadingScreen />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<CurriculumLibraryPage />} />
              <Route path="lesson" element={<LessonPlannerPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="scheme" element={<SchemeOfWorkPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ModelProvider>
  )
}
