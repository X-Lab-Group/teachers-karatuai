import type { Curriculum } from '../types'
import {
  extractCurriculumStructure,
  formatCurriculumSignals,
} from './curriculum-structure'

const CHARS_PER_TOKEN = 4
const MIN_EXCERPT_CHARS = 500

interface BuildOpts {
  curriculum: Curriculum | null | undefined
  topic?: string
  weekNumber?: number
  tokenBudget?: number
}

// The model's total context (input + output) is ~4096 tokens. Schemes and
// lesson plans need ~1500-2500 tokens to *generate*, so the curriculum
// excerpt is capped well under half the budget. Keyword slicing means the
// teacher still gets the relevant slice even when the syllabus is huge.
export function buildCurriculumContextSection({
  curriculum,
  topic,
  weekNumber,
  tokenBudget = 700,
}: BuildOpts): string {
  if (!curriculum?.parsedText) return ''

  const charBudget = tokenBudget * CHARS_PER_TOKEN
  const fullText = curriculum.parsedText
  const header = `OFFICIAL CURRICULUM REFERENCE (${curriculum.title}):\nUse the uploaded curriculum as the authoritative source for scope, sequence, terminology, competences, objectives, activities, assessment, and cross-cutting issues. Do not invent topics that conflict with it.\n\n`
  const headerBudget = charBudget - header.length
  if (headerBudget <= 0) return header.trim()

  const structure = curriculum.structure ?? extractCurriculumStructure(fullText)
  const structureBudget = Math.min(Math.floor(headerBudget * 0.55), 2600)
  const structuredSignals = formatCurriculumSignals(structure, structureBudget)

  if (!structuredSignals) {
    const body =
      fullText.length <= headerBudget
        ? fullText
        : sliceByKeywords(fullText, headerBudget, { topic, weekNumber })
    return header + body
  }

  const excerptBudget = headerBudget - structuredSignals.length - 28
  const relevantExcerpt =
    excerptBudget >= MIN_EXCERPT_CHARS
      ? `RELEVANT SOURCE EXCERPT:\n${sliceByKeywords(fullText, excerptBudget, { topic, weekNumber })}`
      : ''

  return [header + structuredSignals, relevantExcerpt].filter(Boolean).join('\n\n')
}

function sliceByKeywords(
  text: string,
  charBudget: number,
  hints: { topic?: string; weekNumber?: number },
): string {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const keywords = buildKeywords(hints)

  if (keywords.length === 0) {
    return takeFirst(paragraphs, charBudget)
  }

  const scored = paragraphs.map((p, i) => ({
    index: i,
    text: p,
    score: scoreParagraph(p, keywords),
  }))

  const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)
  if (matches.length === 0) {
    return takeFirst(paragraphs, charBudget)
  }

  const selectedIndices = new Set<number>()
  let used = 0
  for (const match of matches) {
    for (const offset of [-1, 0, 1]) {
      const idx = match.index + offset
      if (idx < 0 || idx >= paragraphs.length || selectedIndices.has(idx)) continue
      const len = paragraphs[idx].length + 2
      if (used + len > charBudget) break
      selectedIndices.add(idx)
      used += len
    }
    if (used >= charBudget) break
  }

  return [...selectedIndices]
    .sort((a, b) => a - b)
    .map((i) => paragraphs[i])
    .join('\n\n')
}

function buildKeywords(hints: { topic?: string; weekNumber?: number }): string[] {
  const words: string[] = []
  if (hints.topic) {
    for (const w of hints.topic.toLowerCase().split(/\W+/)) {
      if (w.length >= 4) words.push(w)
    }
  }
  if (hints.weekNumber) {
    words.push(`week ${hints.weekNumber}`)
  }
  return [...new Set(words)]
}

function scoreParagraph(paragraph: string, keywords: string[]): number {
  const lower = paragraph.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    const matches = lower.split(kw).length - 1
    score += matches * (kw.includes(' ') ? 5 : 1)
  }
  return score
}

function takeFirst(paragraphs: string[], charBudget: number): string {
  const out: string[] = []
  let used = 0
  for (const p of paragraphs) {
    const len = p.length + 2
    if (used + len > charBudget) break
    out.push(p)
    used += len
  }
  return out.join('\n\n')
}
