export type EducationLevel = 'primary' | 'secondary' | 'tertiary'

export type Subject =
  | 'mathematics'
  | 'english'
  | 'science'
  | 'social_studies'
  | 'civic_education'
  | 'agriculture'
  | 'computer_science'
  | 'business_studies'
  | 'creative_arts'
  | 'physical_education'
  | 'religious_studies'
  | 'local_language'
  | 'french'
  | 'arabic'
  | 'other'

export interface LessonPlan {
  id: string
  title: string
  subject: Subject
  level: EducationLevel
  grade: string
  duration: number
  objectives: string[]
  materials: string[]
  introduction: string
  mainActivity: string
  conclusion: string
  assessment: string
  homework?: string
  createdAt: Date
  updatedAt: Date
}

export interface Activity {
  id: string
  title: string
  description: string
  content: string
  type: 'individual' | 'group' | 'class'
  duration: number
  materials: string[]
  instructions: string[]
  level: EducationLevel
  subject: Subject
  createdAt: Date
}

export interface Assessment {
  id: string
  title: string
  content: string
  type: 'quiz' | 'test' | 'worksheet' | 'rubric'
  questions: AssessmentQuestion[]
  level: EducationLevel
  subject: Subject
  createdAt: Date
}

export interface AssessmentQuestion {
  id: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
  options?: string[]
  correctAnswer?: string
  points: number
}

export type Term = 'first' | 'second' | 'third'

export interface SchemeOfWork {
  id: string
  title: string
  subject: Subject
  level: EducationLevel
  grade: string
  term: Term
  weekCount: number
  content: string
  createdAt: Date
}

export interface AppSettings {
  language: 'en' | 'fr' | 'sw' | 'ha' | 'yo' | 'ig' | 'ar'
  theme: 'light' | 'dark' | 'system'
  educationLevel: EducationLevel
  country?: string
  region?: string
  localLanguage?: string
  modelDownloaded: boolean
  modelDownloadProgress: number
}

export interface LocalContext {
  country?: string
  region?: string
  localLanguage?: string
}

export interface GenerationState {
  isGenerating: boolean
  progress: number
  error: string | null
}
