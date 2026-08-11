import type { FieldOutOfBoundsIssue } from './types'

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[c] || c
  })
}

export function buildOutOfBoundsMessage(issues: FieldOutOfBoundsIssue[], prefix: string): string {
  const MAX = 3
  const lines = issues.slice(0, MAX).map((i) => `• Página ${i.page} — "${escapeHtml(i.name)}" (${escapeHtml(i.reason)})`)
  const extra = issues.length > MAX ? `<br>…y ${issues.length - MAX} más` : ''
  const footer = '<br><strong>El documento no se podrá visualizar hasta corregir estos errores.</strong>'
  return `<div style="display:inline-block;text-align:left;max-width:380px;line-height:1.35;white-space:normal;font-size:12px;">${escapeHtml(prefix)}<br>${lines.join('<br>')}${extra}${footer}</div>`
}

export function findFieldsOutOfPrintableArea(
  schemas: any[],
  basePdf: { width: number; height: number; padding: number[] },
): FieldOutOfBoundsIssue[] {
  if (!Array.isArray(schemas) || !basePdf?.padding || basePdf.padding.length !== 4) return []
  const [top, right, bottom, left] = basePdf.padding
  const printableRight = basePdf.width - right
  const printableBottom = basePdf.height - bottom
  const EPSILON = 0.01
  const issues: FieldOutOfBoundsIssue[] = []

  schemas.forEach((pageSchemas: any, pageIdx: number) => {
    if (!Array.isArray(pageSchemas)) return
    pageSchemas.forEach((field: any) => {
      if (!field || typeof field.position !== 'object') return
      const x = Number(field.position.x) || 0
      const y = Number(field.position.y) || 0
      const w = Number(field.width) || 0
      const h = Number(field.height) || 0
      const reasons: string[] = []
      if (x + EPSILON < left) reasons.push('sale por la izquierda')
      if (y + EPSILON < top) reasons.push('sale por arriba')
      if (x + w > printableRight + EPSILON) reasons.push('sale por la derecha')
      if (y + h > printableBottom + EPSILON) reasons.push('sale por abajo')
      if (reasons.length) {
        issues.push({
          page: pageIdx + 1,
          name: field.name || '(sin nombre)',
          reason: reasons.join(', '),
        })
      }
    })
  })

  return issues
}
