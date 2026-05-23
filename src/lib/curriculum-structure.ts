import type { Curriculum, CurriculumStructure } from '../types'

type CurriculumSignalKey = keyof CurriculumStructure

interface SignalDefinition {
  key: CurriculumSignalKey
  label: string
  patterns: RegExp[]
}

interface SignalGroup {
  key: CurriculumSignalKey
  label: string
  items: string[]
}

const MAX_ITEMS_PER_GROUP = 6
const MAX_ITEM_CHARS = 280
const SNIPPET_CHARS = 520
const MIN_SIGNAL_CHARS = 12

const EMPTY_STRUCTURE: CurriculumStructure = {
  units: [],
  competences: [],
  objectives: [],
  content: [],
  activities: [],
  assessments: [],
  materials: [],
  crossCuttingIssues: [],
  references: [],
}

const SIGNAL_DEFINITIONS: SignalDefinition[] = [
  {
    key: 'units',
    label: 'Unit/topic sequence',
    patterns: [
      /\bunit\s+(?:title|name|number|no\.?|n[ºo])\b/gi,
      /\bunit\s+\d+\b/gi,
      /\btopic(?:s)?\b/gi,
      /\bsub[-\s]?topic(?:s)?\b/gi,
      /\btheme(?:s)?\b/gi,
      /\bstrand(?:s)?\b/gi,
    ],
  },
  {
    key: 'competences',
    label: 'Key competences',
    patterns: [
      /\bkey\s+unit\s+competenc(?:e|y|ies)\b/gi,
      /\bgeneric\s+competenc(?:e|y|ies)\b/gi,
      /\bcompetenc(?:e|y|ies)\b/gi,
    ],
  },
  {
    key: 'objectives',
    label: 'Learning objectives/outcomes',
    patterns: [
      /\binstructional\s+objectives?\b/gi,
      /\blearning\s+objectives?\b/gi,
      /\bspecific\s+objectives?\b/gi,
      /\blearning\s+outcomes?\b/gi,
      /\bexpected\s+outcomes?\b/gi,
    ],
  },
  {
    key: 'content',
    label: 'Content/scope',
    patterns: [
      /\bcontent(?:s)?\b/gi,
      /\bscope\b/gi,
      /\bconcept(?:s)?\b/gi,
      /\bknowledge\b/gi,
      /\bskills?\b/gi,
      /\battitudes?\s+and\s+values?\b/gi,
    ],
  },
  {
    key: 'activities',
    label: 'Suggested activities',
    patterns: [
      /\bteaching\s+and\s+learning\s+activit(?:y|ies)\b/gi,
      /\bteacher\s+activit(?:y|ies)\b/gi,
      /\blearner\s+activit(?:y|ies)\b/gi,
      /\blearning\s+activit(?:y|ies)\b/gi,
      /\bsuggested\s+activit(?:y|ies)\b/gi,
      /\bmethodology\b/gi,
    ],
  },
  {
    key: 'assessments',
    label: 'Assessment/evaluation',
    patterns: [
      /\bassessment(?:s)?\b/gi,
      /\bevaluation\b/gi,
      /\bsuccess\s+criteria\b/gi,
      /\bcriteria\b/gi,
      /\bquiz(?:zes)?\b/gi,
      /\bexercise(?:s)?\b/gi,
    ],
  },
  {
    key: 'materials',
    label: 'Materials/resources',
    patterns: [
      /\blearning\s+materials?\b/gi,
      /\bteaching\s+aids?\b/gi,
      /\bmaterials?\b/gi,
      /\bresources?\b/gi,
      /\bequipment\b/gi,
      /\bapparatus\b/gi,
    ],
  },
  {
    key: 'crossCuttingIssues',
    label: 'Cross-cutting issues',
    patterns: [
      /\bcross[-\s]?cutting\s+issues?\b/gi,
      /\binclusive\s+education\b/gi,
      /\bgender(?:\s+education)?\b/gi,
      /\bpeace\s+and\s+values?\s+education\b/gi,
      /\bfinancial\s+education\b/gi,
      /\benvironment(?:al)?\s+and\s+sustainability\b/gi,
      /\bstandardization\s+culture\b/gi,
      /\bgenocide\s+studies\b/gi,
    ],
  },
  {
    key: 'references',
    label: 'References',
    patterns: [
      /\breferences?\b/gi,
      /\bbibliography\b/gi,
      /\btextbooks?\b/gi,
      /\bsource(?:s)?\b/gi,
      /\bhttps?:\/\/\S+/gi,
    ],
  },
]

export function extractCurriculumStructure(text: string): CurriculumStructure {
  const normalized = normalizeCurriculumText(text)
  if (!normalized) return cloneEmptyStructure()

  return SIGNAL_DEFINITIONS.reduce((structure, signal) => {
    structure[signal.key] = extractSignals(normalized, signal.patterns)
    return structure
  }, cloneEmptyStructure())
}

export function getCurriculumStructure(curriculum: Curriculum): CurriculumStructure {
  return curriculum.structure ?? extractCurriculumStructure(curriculum.parsedText)
}

export function getCurriculumSignalGroups(structure: CurriculumStructure): SignalGroup[] {
  return SIGNAL_DEFINITIONS.map(({ key, label }) => ({
    key,
    label,
    items: structure[key],
  })).filter((group) => group.items.length > 0)
}

export function countCurriculumSignals(structure: CurriculumStructure): number {
  return getCurriculumSignalGroups(structure).reduce((total, group) => total + group.items.length, 0)
}

export function formatCurriculumSignals(
  structure: CurriculumStructure,
  charBudget: number,
): string {
  if (charBudget <= 0) return ''

  const groups = getCurriculumSignalGroups(structure)
  if (groups.length === 0) return ''

  const lines = ['STRUCTURED CURRICULUM SIGNALS (extracted from uploaded source):']
  let used = lines[0].length + 1

  for (const group of groups) {
    const groupHeader = `${group.label}:`
    if (!appendLine(lines, groupHeader, charBudget, used)) break
    used += groupHeader.length + 1

    for (const item of group.items) {
      const line = `- ${item}`
      if (!appendLine(lines, line, charBudget, used)) return lines.join('\n')
      used += line.length + 1
    }
  }

  return lines.join('\n')
}

function extractSignals(text: string, patterns: RegExp[]): string[] {
  const snippets: string[] = []

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined) continue
      const snippet = cleanSnippet(takeContextWindow(text, match.index))
      if (snippet.length >= MIN_SIGNAL_CHARS) snippets.push(snippet)
    }
  }

  return uniqueSignals(snippets).slice(0, MAX_ITEMS_PER_GROUP)
}

function normalizeCurriculumText(text: string): string {
  return text
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\uFB00/g, 'ff')
    .replace(/\uFB01/g, 'fi')
    .replace(/\uFB02/g, 'fl')
    .replace(/\uFB03/g, 'ffi')
    .replace(/\uFB04/g, 'ffl')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function takeContextWindow(text: string, matchIndex: number): string {
  const startBoundary = findStartBoundary(text, matchIndex)
  const hardEnd = Math.min(text.length, matchIndex + SNIPPET_CHARS)
  const endBoundary = findEndBoundary(text, matchIndex, hardEnd)

  return text.slice(startBoundary, endBoundary)
}

function findStartBoundary(text: string, index: number): number {
  const searchStart = Math.max(0, index - 180)
  const before = text.slice(searchStart, index)
  const newline = before.lastIndexOf('\n')
  if (newline >= 0) return searchStart + newline + 1

  const sentence = Math.max(before.lastIndexOf('. '), before.lastIndexOf('; '))
  if (sentence >= 0) return searchStart + sentence + 2

  return index
}

function findEndBoundary(text: string, matchIndex: number, hardEnd: number): number {
  const window = text.slice(matchIndex, hardEnd)
  const newline = window.indexOf('\n')
  if (newline >= 0 && matchIndex + newline - findStartBoundary(text, matchIndex) >= MIN_SIGNAL_CHARS) {
    return matchIndex + newline
  }

  const slice = text.slice(0, hardEnd)
  const sentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('; '))
  if (sentence >= hardEnd - 180) return sentence + 1

  return hardEnd
}

function cleanSnippet(snippet: string): string {
  const compact = snippet
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim()

  if (compact.length <= MAX_ITEM_CHARS) return compact
  return `${compact.slice(0, MAX_ITEM_CHARS - 1).trim()}…`
}

function uniqueSignals(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const item of items) {
    const key = item.toLowerCase().replace(/\W+/g, ' ').trim()
    if (!key || seen.has(key)) continue
    if ([...seen].some((existing) => key.includes(existing) || existing.includes(key))) continue
    seen.add(key)
    out.push(item)
  }

  return out
}

function appendLine(lines: string[], line: string, budget: number, used: number): boolean {
  if (used + line.length + 1 > budget) return false
  lines.push(line)
  return true
}

function cloneEmptyStructure(): CurriculumStructure {
  return {
    units: [...EMPTY_STRUCTURE.units],
    competences: [...EMPTY_STRUCTURE.competences],
    objectives: [...EMPTY_STRUCTURE.objectives],
    content: [...EMPTY_STRUCTURE.content],
    activities: [...EMPTY_STRUCTURE.activities],
    assessments: [...EMPTY_STRUCTURE.assessments],
    materials: [...EMPTY_STRUCTURE.materials],
    crossCuttingIssues: [...EMPTY_STRUCTURE.crossCuttingIssues],
    references: [...EMPTY_STRUCTURE.references],
  }
}
