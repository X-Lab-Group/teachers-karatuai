import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ModelProvider from './contexts/ModelContext'
import ModelLoadingScreen from './components/ModelLoadingScreen'
import Layout from './components/layout/Layout'

const LessonPlannerPage = lazy(() => import('./pages/LessonPlannerPage'))
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'))
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <ModelProvider>
      <ModelLoadingScreen />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LessonPlannerPage />} />
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ModelProvider>
  )
}
