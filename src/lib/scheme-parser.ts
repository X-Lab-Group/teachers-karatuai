export interface SchemeWeek {
  number: number
  topic: string
}

const WEEK_HEADING_REGEX = /^#{1,4}\s*Week\s+(\d+)\s*[:\-–—]\s*(.+?)\s*$/gim
const WEEK_LINE_REGEX = /^(?:[-*]\s*)?(?:#{1,6}\s*)?Week\s+(\d+)\s*[:\-–—]\s*(.+?)\s*$/gim
const WEEK_TABLE_ROW_REGEX = /^\|\s*(?:Week\s*)?(\d+)\s*\|\s*([^|]+?)\s*\|/gim

export function parseSchemeWeeks(content: string): SchemeWeek[] {
  return parseWeeksWith(content, [WEEK_HEADING_REGEX, WEEK_LINE_REGEX])
}

export function parseSchemeOutlineWeeks(content: string): SchemeWeek[] {
  return parseWeeksWith(content, [WEEK_LINE_REGEX, WEEK_TABLE_ROW_REGEX])
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

function cleanWeekTopic(topic: string): string {
  return topic
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
