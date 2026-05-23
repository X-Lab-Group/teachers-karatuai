import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

interface TextItemWithPosition {
  str: string
  transform?: number[]
  hasEOL?: boolean
}

interface TextRow {
  y: number
  items: Array<{ x: number; text: string; hasEOL?: boolean }>
}

const ROW_TOLERANCE = 2

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const text = extractPageText(content.items)
    if (text) pages.push(text)
  }

  await pdf.destroy()
  return pages.join('\n\n')
}

function extractPageText(items: unknown[]): string {
  const rows: TextRow[] = []

  for (const item of items) {
    if (!isTextItem(item)) continue
    const text = item.str.replace(/\s+/g, ' ').trim()
    if (!text) continue

    const x = item.transform?.[4] ?? 0
    const y = item.transform?.[5] ?? 0
    const row = findRow(rows, y)
    row.items.push({ x, text, hasEOL: item.hasEOL })
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
}

function findRow(rows: TextRow[], y: number): TextRow {
  const row = rows.find((candidate) => Math.abs(candidate.y - y) <= ROW_TOLERANCE)
  if (row) return row

  const next = { y, items: [] }
  rows.push(next)
  return next
}

function isTextItem(item: unknown): item is TextItemWithPosition {
  return Boolean(item && typeof item === 'object' && 'str' in item)
}
