import Dexie, { type EntityTable } from 'dexie'
import type {
  LessonPlan,
  Activity,
  Assessment,
  AppSettings,
  SchemeOfWork,
  Curriculum,
  EducationLevel,
  Subject,
} from '../../types'
import { extractCurriculumStructure } from '../curriculum-structure'

const db = new Dexie('TeachersDigitalLiteracy') as Dexie & {
  lessonPlans: EntityTable<LessonPlan, 'id'>
  activities: EntityTable<Activity, 'id'>
  assessments: EntityTable<Assessment, 'id'>
  schemes: EntityTable<SchemeOfWork, 'id'>
  curricula: EntityTable<Curriculum, 'id'>
  settings: EntityTable<AppSettings & { id: string }, 'id'>
}

db.version(1).stores({
  lessonPlans: 'id, subject, level, createdAt',
  activities: 'id, subject, level, createdAt',
  assessments: 'id, subject, level, createdAt',
  settings: 'id',
})

db.version(2).stores({
  schemes: 'id, subject, level, term, createdAt',
})

db.version(3).stores({
  lessonPlans: 'id, subject, level, createdAt, schemeId',
  activities: 'id, subject, level, createdAt, lessonId, schemeId',
  assessments: 'id, subject, level, createdAt, lessonId, schemeId',
})

db.version(4).stores({
  curricula: 'id, country, level, subject, grade, createdAt, [country+level+subject+grade]',
})

db.version(5).stores({
  schemes: 'id, subject, level, term, createdAt, curriculumId',
  lessonPlans: 'id, subject, level, createdAt, schemeId, curriculumId',
})

export { db }

function normalizeGrade(grade: string): string {
  return grade.trim().toLowerCase()
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app')
  return (
    settings ?? {
      language: 'en',
      theme: 'system',
      educationLevel: 'primary',
      modelDownloaded: false,
      modelDownloadProgress: 0,
    }
  )
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const current = await getSettings()
  await db.settings.put({ ...current, ...settings, id: 'app' })
}

export async function saveLessonPlan(plan: LessonPlan) {
  await db.lessonPlans.put(plan)
}

export async function getLessonPlans() {
  return db.lessonPlans.orderBy('createdAt').reverse().toArray()
}

export async function deleteLessonPlan(id: string) {
  await db.lessonPlans.delete(id)
}

export async function saveActivity(activity: Activity) {
  await db.activities.put(activity)
}

export async function getActivities() {
  return db.activities.orderBy('createdAt').reverse().toArray()
}

export async function saveAssessment(assessment: Assessment) {
  await db.assessments.put(assessment)
}

export async function getAssessments() {
  return db.assessments.orderBy('createdAt').reverse().toArray()
}

export async function saveScheme(scheme: SchemeOfWork) {
  await db.schemes.put(scheme)
}

export async function getSchemes() {
  return db.schemes.orderBy('createdAt').reverse().toArray()
}

export async function getScheme(id: string) {
  return db.schemes.get(id)
}

export async function deleteScheme(id: string) {
  await db.schemes.delete(id)
}

export async function getLessonPlan(id: string) {
  return db.lessonPlans.get(id)
}

export async function getLessonsBySchemeId(schemeId: string) {
  const all = await db.lessonPlans.where('schemeId').equals(schemeId).toArray()
  return all.sort((a, b) => (a.weekNumber ?? 0) - (b.weekNumber ?? 0))
}

export async function getActivitiesByLessonId(lessonId: string) {
  return db.activities.where('lessonId').equals(lessonId).reverse().sortBy('createdAt')
}

export async function getAssessmentsByLessonId(lessonId: string) {
  return db.assessments.where('lessonId').equals(lessonId).reverse().sortBy('createdAt')
}

export async function deleteActivity(id: string) {
  await db.activities.delete(id)
}

export async function deleteAssessment(id: string) {
  await db.assessments.delete(id)
}

export async function saveCurriculum(curriculum: Curriculum) {
  await db.curricula.put({
    ...curriculum,
    structure: curriculum.structure ?? extractCurriculumStructure(curriculum.parsedText),
  })
  // Default the app's country from the first curriculum a teacher saves so the
  // local-context plumbing (currency, exam boards, language hints) lights up
  // without requiring a separate trip to Settings. Existing values are kept.
  const settings = await getSettings()
  if (!settings.country) {
    await saveSettings({ country: curriculum.country })
  }
}

export async function getCurricula() {
  return db.curricula.orderBy('createdAt').reverse().toArray()
}

export async function getCurriculum(id: string) {
  return db.curricula.get(id)
}

export async function deleteCurriculum(id: string) {
  await db.curricula.delete(id)
}

// Curricula are a teacher's personal library — country is a categorization
// tag, not a hard filter, and grade is free-form text. Match on the
// teacher-meaningful fields with case/whitespace-insensitive grade comparison
// so a typo like "Primary 4" vs "primary 4 " doesn't silently break the link.
export async function findCurriculum(filter: {
  level: EducationLevel
  subject: Subject
  grade: string
}) {
  const target = normalizeGrade(filter.grade)
  return db.curricula
    .where('level')
    .equals(filter.level)
    .filter((c) => c.subject === filter.subject && normalizeGrade(c.grade) === target)
    .first()
}
