import { marked } from 'marked'

export type DocumentType = 'lesson' | 'activity' | 'assessment' | 'scheme'

const ACCENTS: Record<DocumentType, { color: string; subtle: string; label: string }> = {
  lesson: { color: '#097064', subtle: '#d0f0e9', label: 'Lesson Plan' },
  activity: { color: '#d97706', subtle: '#fef3c7', label: 'Activity' },
  assessment: { color: '#db2777', subtle: '#fce7f3', label: 'Assessment' },
  scheme: { color: '#6366f1', subtle: '#e0e7ff', label: 'Scheme of Work' },
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderMarkdown(content: string): string {
  marked.setOptions({ gfm: true, breaks: false })
  return marked.parse(content, { async: false }) as string
}

function buildStyles(accent: string, subtle: string): string {
  return `
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      line-height: 1.55;
      font-size: 11pt;
      -webkit-font-smoothing: antialiased;
    }
    .page { max-width: 720px; margin: 0 auto; padding: 24px; }
    .header { border-bottom: 2px solid ${accent}; padding-bottom: 14px; margin-bottom: 22px; }
    .header .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10pt;
      font-weight: 600;
      color: ${accent};
      margin: 0 0 6px;
    }
    .header h1 {
      margin: 0;
      font-size: 22pt;
      line-height: 1.25;
      color: #0f172a;
      font-weight: 700;
    }
    .content h1, .content h2, .content h3, .content h4 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.3;
      margin: 22px 0 8px;
    }
    .content h1 { font-size: 18pt; color: ${accent}; }
    .content h2 { font-size: 15pt; }
    .content h3 { font-size: 13pt; color: #334155; }
    .content h4 { font-size: 11.5pt; color: #475569; }
    .content p { margin: 0 0 10px; }
    .content strong { color: #0f172a; font-weight: 600; }
    .content em { color: #334155; }
    .content ul, .content ol { margin: 0 0 12px; padding-left: 22px; }
    .content li { margin-bottom: 4px; }
    .content li > p { margin: 0; }
    .content blockquote {
      margin: 12px 0;
      padding: 8px 14px;
      border-left: 3px solid ${accent};
      background: ${subtle};
      color: #334155;
      border-radius: 0 6px 6px 0;
    }
    .content code {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: 10pt;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 4px;
      color: #0f172a;
    }
    .content pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 9.5pt;
      line-height: 1.45;
    }
    .content pre code { background: transparent; color: inherit; padding: 0; }
    .content hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 10.5pt;
    }
    .content th, .content td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    .content th { background: ${subtle}; color: #0f172a; font-weight: 600; }
    .content a { color: ${accent}; text-decoration: none; }
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      font-size: 9pt;
      color: #94a3b8;
      text-align: center;
    }
    h1, h2, h3, h4 { page-break-after: avoid; }
    li, p, blockquote, pre, table { page-break-inside: avoid; }
    @media print {
      body { font-size: 10.5pt; }
      .page { padding: 0; max-width: none; }
    }
  `
}

export interface PrintOptions {
  title: string
  content: string
  documentType: DocumentType
  subtitle?: string
}

export function exportAsPDF({ title, content, documentType, subtitle }: PrintOptions): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const accent = ACCENTS[documentType]
  const body = renderMarkdown(content || '')
  const safeTitle = escapeHtml(title)
  const safeSubtitle = subtitle ? escapeHtml(subtitle) : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>${buildStyles(accent.color, accent.subtle)}</style>
</head>
<body>
<div class="page">
  <header class="header">
    <p class="eyebrow">${accent.label}</p>
    <h1>${safeTitle}</h1>
    ${safeSubtitle ? `<p style="margin:8px 0 0;color:#64748b;font-size:10.5pt;">${safeSubtitle}</p>` : ''}
  </header>
  <main class="content">${body}</main>
  <footer class="footer">Created with KaratuAI &mdash; AI-powered teaching tools</footer>
</div>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 250)
}
