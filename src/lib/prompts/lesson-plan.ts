import type { EducationLevel, LocalContext, Subject, Term } from '../../types'
import { buildLocalContextSection } from '../local-context'

const TERM_LABEL: Record<Term, string> = {
  first: 'First Term',
  second: 'Second Term',
  third: 'Third Term',
}

const LEVEL_CONTEXT: Record<EducationLevel, string> = {
  primary:
    'Primary school students (ages 6-11). Use simple language, visual aids, hands-on activities, and short attention spans. Focus on foundational concepts.',
  secondary:
    'Secondary school students (ages 12-17). Can handle abstract concepts, longer activities, group work, and basic research. Include real-world applications.',
  tertiary:
    'University/polytechnic students (18+). Advanced concepts, critical thinking, research integration, professional applications, and self-directed learning.',
}

const SUBJECT_NAMES: Record<Subject, string> = {
  mathematics: 'Mathematics',
  english: 'English Language',
  science: 'Science',
  social_studies: 'Social Studies',
  civic_education: 'Civic Education',
  agriculture: 'Agricultural Science',
  computer_science: 'Computer Science/ICT',
  business_studies: 'Business Studies',
  creative_arts: 'Creative Arts',
  physical_education: 'Physical Education',
  religious_studies: 'Religious Studies',
  local_language: 'Local Language',
  french: 'French',
  arabic: 'Arabic',
  other: 'General Subject',
}

interface SchemeWeekPlan {
  number: number
  topic: string
}

function withSection(section: string): string {
  return section ? `\n\n${section}\n` : ''
}

export function buildLessonPlanPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  grade: string
  duration: number
  additionalContext?: string
  localContext?: LocalContext
  curriculumSection?: string
}): string {
  const { topic, subject, level, grade, duration, additionalContext, localContext, curriculumSection } = params
  const localSection = buildLocalContextSection(localContext)

  return `You are an experienced African teacher helping create lesson plans. Create a detailed, practical lesson plan.
${withSection(localSection)}${withSection(curriculumSection ?? '')}
CONTEXT:
- Subject: ${SUBJECT_NAMES[subject]}
- Education Level: ${LEVEL_CONTEXT[level]}
- Grade/Year: ${grade}
- Duration: ${duration} minutes
- Topic: ${topic}
${additionalContext ? `- Additional Notes: ${additionalContext}` : ''}

Create a lesson plan with these sections:

1. LEARNING OBJECTIVES (3-5 clear, measurable objectives starting with action verbs)

2. MATERIALS NEEDED (practical items available in African schools - avoid expensive tech)

3. INTRODUCTION (${Math.round(duration * 0.15)} mins)
- Hook to capture attention
- Connect to prior knowledge
- State lesson objectives

4. MAIN ACTIVITY (${Math.round(duration * 0.6)} mins)
- Step-by-step teaching instructions
- Include student activities
- Questions to ask students
- Examples relevant to the local context above

5. CONCLUSION (${Math.round(duration * 0.15)} mins)
- Summary of key points
- Check for understanding
- Preview next lesson

6. ASSESSMENT
- How to evaluate student understanding
- Sample questions or activities

7. HOMEWORK (optional but recommended)

Format the response clearly with headers. Use simple, clear language. Ground all examples in the local context above.`
}

export function buildActivityPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  activityType: 'individual' | 'group' | 'class'
  duration: number
  localContext?: LocalContext
}): string {
  const { topic, subject, level, activityType, duration, localContext } = params
  const levelDesc = level === 'primary' ? 'primary school' : level === 'secondary' ? 'secondary school' : 'university'
  const localSection = buildLocalContextSection(localContext)

  return `Create a ${duration}-minute ${activityType} activity about "${topic}" for ${levelDesc} ${SUBJECT_NAMES[subject]} students.
${withSection(localSection)}
## Activity Title
Write a catchy title here.

## What You Need
List 3-5 simple materials available in African schools.

## Instructions
1. First step
2. Second step
3. Continue with clear numbered steps

## What Students Will Learn
Describe the learning outcomes.

Keep it simple and hands-on. Ground every example in the local context above.`
}

export function buildAssessmentPrompt(params: {
  topic: string
  subject: Subject
  level: EducationLevel
  assessmentType: 'quiz' | 'test' | 'worksheet'
  questionCount: number
  localContext?: LocalContext
}): string {
  const { topic, subject, level, assessmentType, questionCount, localContext } = params
  const levelDesc = level === 'primary' ? 'primary school' : level === 'secondary' ? 'secondary school' : 'university'
  const localSection = buildLocalContextSection(localContext)

  return `Create a ${assessmentType} with ${questionCount} questions about "${topic}" for ${levelDesc} ${SUBJECT_NAMES[subject]} students.
${withSection(localSection)}
## ${topic} - ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}

**Question 1** (Multiple Choice)
Write a question here.
A) Option A
B) Option B
C) Option C
D) Option D
**Answer: A**

**Question 2** (True/False)
Write a statement here.
**Answer: True**

**Question 3** (Short Answer)
Write a question here.
**Answer: Write the expected answer.**

Continue with ${questionCount - 3} more questions. Mix question types. Ground every example in the local context above.`
}

export function buildSchemePrompt(params: {
  subject: Subject
  level: EducationLevel
  grade: string
  term: Term
  weekCount: number
  localContext?: LocalContext
  curriculumSection?: string
}): string {
  const { subject, level, grade, term, weekCount, localContext, curriculumSection } = params
  const localSection = buildLocalContextSection(localContext)

  return `You are an experienced African curriculum planner. Build a ${weekCount}-week scheme of work for ${SUBJECT_NAMES[subject]}, ${grade} (${LEVEL_CONTEXT[level].split('.')[0]}), ${TERM_LABEL[term]}.
${withSection(localSection)}${withSection(curriculumSection ?? '')}
Produce a markdown table of contents, then for each week use this structure:

## Week {n}: {Topic}
- **Learning Objectives**: 2-3 measurable objectives starting with action verbs
- **Sub-topics**: comma-separated list
- **Teaching Activities**: 2-3 concrete classroom activities
- **Materials**: simple, locally-available items
- **Assessment**: how the teacher checks understanding this week

Rules:
- Sequence topics so each week builds on the last
- Keep language simple and practical for African classrooms
- Ground examples in the local context above (currency, foods, names, landmarks)
- For exam-board terms (final term), include a revision week and a mock-exam week
- Output exactly ${weekCount} weeks. No extra commentary.`
}

export function buildSchemeOutlinePrompt(params: {
  subject: Subject
  level: EducationLevel
  grade: string
  term: Term
  weekCount: number
  localContext?: LocalContext
  curriculumSection?: string
}): string {
  const { subject, level, grade, term, weekCount, localContext, curriculumSection } = params
  const localSection = buildLocalContextSection(localContext)

  return `You are an experienced African curriculum planner. Plan the topic sequence for a ${weekCount}-week scheme of work for ${SUBJECT_NAMES[subject]}, ${grade} (${LEVEL_CONTEXT[level].split('.')[0]}), ${TERM_LABEL[term]}.
${withSection(localSection)}${withSection(curriculumSection ?? '')}
Return exactly ${weekCount} lines and nothing else.
Use this exact format for every line:
Week 1: Topic
Week 2: Topic

Rules:
- Number every week from 1 to ${weekCount}; do not skip or merge weeks
- Sequence topics so each week builds on the last
- Align with the official curriculum reference when provided
- Keep each topic short and teachable in one week
- For final/exam terms, include revision and mock-exam preparation near the end`
}

export function buildSchemeChunkPrompt(params: {
  subject: Subject
  level: EducationLevel
  grade: string
  term: Term
  weekCount: number
  outline: SchemeWeekPlan[]
  weeks: SchemeWeekPlan[]
  localContext?: LocalContext
  curriculumSection?: string
}): string {
  const {
    subject,
    level,
    grade,
    term,
    weekCount,
    outline,
    weeks,
    localContext,
    curriculumSection,
  } = params
  const localSection = buildLocalContextSection(localContext)
  const firstWeek = weeks[0]?.number
  const lastWeek = weeks[weeks.length - 1]?.number
  const outlineText = outline.map((week) => `Week ${week.number}: ${week.topic}`).join('\n')
  const targetWeeks = weeks.map((week) => `Week ${week.number}: ${week.topic}`).join('\n')

  return `You are writing part of a ${weekCount}-week scheme of work for ${SUBJECT_NAMES[subject]}, ${grade} (${LEVEL_CONTEXT[level].split('.')[0]}), ${TERM_LABEL[term]}.
${withSection(localSection)}${withSection(curriculumSection ?? '')}
FULL TERM TOPIC SEQUENCE:
${outlineText}

WRITE DETAILS ONLY FOR THESE WEEKS:
${targetWeeks}

Output markdown only. For each selected week, use this exact heading format:
## Week {number}: {topic}

Under each heading, write exactly these one-line fields:
- **Learning Objectives**: 2 measurable objectives
- **Sub-topics**: 2-4 sub-topics
- **Teaching Activities**: 2 practical classroom activities
- **Materials**: simple, locally-available items
- **Assessment**: how the teacher checks understanding

Rules:
- Output weeks ${firstWeek}-${lastWeek} only
- Do not include a table of contents, introduction, conclusion, or extra commentary
- Keep each field compact but specific
- Preserve the exact week numbers and topics listed above
- Ground examples in the local context above`
}
