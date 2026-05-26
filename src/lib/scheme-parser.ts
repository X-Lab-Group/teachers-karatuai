export interface SchemeWeek {
  number: number
  topic: string
  learningObjectives?: string
  subTopics?: string
  teachingActivities?: string
  materials?: string
  assessment?: string
}

const WEEK_HEADING_REGEX = /^#{1,4}\s*Week\s+(\d+)\s*[:\-–—]\s*(.+?)\s*$/gim
const WEEK_LINE_REGEX = /^(?:[-*]\s*)?(?:#{1,6}\s*)?Week\s+(\d+)\s*[:\-–—]\s*(.+?)\s*$/gim
const WEEK_TABLE_ROW_REGEX = /^\|\s*(?:Week\s*)?(\d+)\s*\|\s*([^|]+?)\s*\|/gim

const WEEK_DETAIL_FIELDS = [
  {
    key: 'learningObjectives',
    labels: ['learning objectives', 'objectives', 'objective'],
  },
  {
    key: 'subTopics',
    labels: ['sub-topics', 'sub topics', 'subtopics', 'content', 'scope'],
  },
  {
    key: 'teachingActivities',
    labels: ['teaching activities', 'learning activities', 'activities', 'teacher activities'],
  },
  {
    key: 'materials',
    labels: ['materials', 'resources', 'learning materials', 'teaching aids'],
  },
  {
    key: 'assessment',
    labels: ['assessment', 'evaluation', 'check for understanding'],
  },
] as const

type WeekDetailKey = (typeof WEEK_DETAIL_FIELDS)[number]['key']

export function parseSchemeWeeks(content: string): SchemeWeek[] {
  return mergeWeeks([
    ...parseHeadingWeeks(content),
    ...parseTableWeeks(content),
    ...parseWeeksWith(content, [WEEK_LINE_REGEX]),
  ])
}

export function parseSchemeOutlineWeeks(content: string): SchemeWeek[] {
  return mergeWeeks([
    ...parseWeeksWith(content, [WEEK_LINE_REGEX, WEEK_TABLE_ROW_REGEX]),
    ...parseTableWeeks(content),
  ])
}

function parseHeadingWeeks(content: string): SchemeWeek[] {
  if (!content) return []

  const matches = [...content.matchAll(WEEK_HEADING_REGEX)]
  return matches
    .map((match, index) => {
      const number = parseInt(match[1], 10)
      const topic = cleanWeekTopic(match[2])
      if (Number.isNaN(number) || !topic || match.index === undefined) return null

      const bodyStart = match.index + match[0].length
      const nextMatch = matches[index + 1]
      const bodyEnd = nextMatch?.index ?? content.length
      const details = parseWeekDetails(content.slice(bodyStart, bodyEnd))

      return { number, topic, ...details }
    })
    .filter((week): week is SchemeWeek => Boolean(week))
}

function parseTableWeeks(content: string): SchemeWeek[] {
  const rows = extractMarkdownTableRows(content)
  if (rows.length === 0) return []

  const weeks: SchemeWeek[] = []
  for (const block of rows) {
    const header = splitTableRow(block[0]).map(normalizeHeader)
    const weekIndex = findHeaderIndex(header, ['week', 'week no', 'week number'])
    const topicIndex = findHeaderIndex(header, ['topic', 'lesson', 'unit', 'content'])

    if (weekIndex === -1) continue

    for (const row of block.slice(1)) {
      if (isTableSeparator(row)) continue

      const cells = splitTableRow(row)
      const number = parseWeekNumber(cells[weekIndex])
      if (number === null) continue

      const topic =
        topicIndex >= 0
          ? cleanWeekTopic(cells[topicIndex])
          : cleanWeekTopic(cells.find((_, cellIndex) => cellIndex !== weekIndex) ?? '')
      if (!topic) continue

      weeks.push({
        number,
        topic,
        ...parseTableDetails(header, cells),
      })
    }
  }

  return weeks
}

function parseWeeksWith(content: string, regexes: RegExp[]): SchemeWeek[] {
  if (!content) return []

  const seen = new Map<number, SchemeWeek>()

  for (const regex of regexes) {
    regex.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const number = parseInt(match[1], 10)
      if (Number.isNaN(number)) continue

      const topic = cleanWeekTopic(match[2])
      if (!topic) continue

      if (!seen.has(number)) {
        seen.set(number, { number, topic })
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.number - b.number)
}

function mergeWeeks(weeks: SchemeWeek[]): SchemeWeek[] {
  const seen = new Map<number, SchemeWeek>()

  for (const week of weeks) {
    const existing = seen.get(week.number)
    if (!existing) {
      seen.set(week.number, week)
      continue
    }

    seen.set(week.number, {
      ...week,
      ...existing,
      learningObjectives: existing.learningObjectives ?? week.learningObjectives,
      subTopics: existing.subTopics ?? week.subTopics,
      teachingActivities: existing.teachingActivities ?? week.teachingActivities,
      materials: existing.materials ?? week.materials,
      assessment: existing.assessment ?? week.assessment,
    })
  }

  return Array.from(seen.values()).sort((a, b) => a.number - b.number)
}

function parseWeekDetails(body: string): Partial<SchemeWeek> {
  const details: Partial<SchemeWeek> = {}
  const fieldRegex = /^\s*(?:[-*•]\s*)?(?:\*\*)?([^:*]+?)(?:\*\*)?\s*:\s*(.+?)\s*$/gm

  let match: RegExpExecArray | null
  while ((match = fieldRegex.exec(body)) !== null) {
    const key = matchFieldKey(match[1])
    if (!key) continue
    details[key] = cleanDetail(match[2])
  }

  return details
}

function parseTableDetails(headers: string[], cells: string[]): Partial<SchemeWeek> {
  const details: Partial<SchemeWeek> = {}

  headers.forEach((header, index) => {
    const key = matchFieldKey(header)
    if (!key) return
    const value = cleanDetail(cells[index] ?? '')
    if (value) details[key] = value
  })

  return details
}

function extractMarkdownTableRows(content: string): string[][] {
  const blocks: string[][] = []
  let current: string[] = []

  for (const line of content.split('\n')) {
    if (/^\s*\|.+\|\s*$/.test(line)) {
      current.push(line)
      continue
    }

    if (current.length > 0) {
      blocks.push(current)
      current = []
    }
  }

  if (current.length > 0) blocks.push(current)
  return blocks.filter((block) => block.length >= 2)
}

function splitTableRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cleanDetail(cell))
}

function isTableSeparator(row: string): boolean {
  return splitTableRow(row).every((cell) => /^:?-{3,}:?$/.test(cell))
}

function parseWeekNumber(value: string): number | null {
  const match = value.match(/\bWeek\s*(\d+)\b|^\s*(\d+)\s*$/i)
  if (!match) return null
  const number = parseInt(match[1] ?? match[2], 10)
  return Number.isNaN(number) ? null : number
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) =>
    candidates.some((candidate) => header === candidate || header.includes(candidate)),
  )
}

function matchFieldKey(label: string): WeekDetailKey | null {
  const normalized = normalizeHeader(label)
  const match = WEEK_DETAIL_FIELDS.find((field) =>
    field.labels.some((candidate) => normalized === candidate || normalized.includes(candidate)),
  )
  return match?.key ?? null
}

function normalizeHeader(value: string): string {
  return value
    .replace(/[*_`]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function cleanWeekTopic(topic: string): string {
  return topic
    .replace(/[*_`]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanDetail(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '; ')
    .replace(/\\\|/g, '|')
    .replace(/[*_`]+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
