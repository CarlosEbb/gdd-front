import type { RichTextLine, RichTextRun } from './types'

/**
 * Escapa los caracteres HTML conflictivos de un texto plano.
 */
export const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Pre-procesa el HTML usando el DOM para convertir spans/font con
 * `text-decoration` o `font-weight` inline en tags semánticos <u>/<s>/<b>.
 * Devuelve null si no hay DOM disponible (ej. ejecución server-side).
 */
const normalizeViaDOM = (html: string): string | null => {
  if (typeof document === 'undefined') return null
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html

  type Seg = { text: string; b: boolean; u: boolean; s: boolean; br?: boolean }
  const segs: Seg[] = []

  const isBoldStyle = (style: CSSStyleDeclaration) => {
    const fw = (style.fontWeight || '').toLowerCase()
    return fw === 'bold' || fw === 'bolder' || /^[6-9]00$/.test(fw)
  }
  const hasDeco = (style: CSSStyleDeclaration, kind: 'underline' | 'line-through') => {
    const td = `${style.textDecoration || ''} ${style.textDecorationLine || ''}`.toLowerCase()
    return td.includes(kind)
  }

  const walk = (node: Node, b: boolean, u: boolean, s: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).data
      if (text) segs.push({ text, b, u, s })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'br') {
      segs.push({ text: '', b, u, s, br: true })
      return
    }

    const newB = b || tag === 'b' || tag === 'strong' || isBoldStyle(el.style)
    const newU = u || tag === 'u' || hasDeco(el.style, 'underline')
    const newS = s || tag === 's' || tag === 'strike' || tag === 'del' || hasDeco(el.style, 'line-through')

    for (const child of Array.from(el.childNodes)) walk(child, newB, newU, newS)

    const isBlock = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag)
    if (isBlock) {
      const last = segs[segs.length - 1]
      if (!last || !last.br) segs.push({ text: '', b, u, s, br: true })
    }
  }

  for (const child of Array.from(wrapper.childNodes)) walk(child, false, false, false)

  // Emitir HTML cerrando/abriendo tags consistentemente.
  let out = ''
  let openB = false,
    openU = false,
    openS = false
  const closeAll = () => {
    if (openS) {
      out += '</s>'
      openS = false
    }
    if (openU) {
      out += '</u>'
      openU = false
    }
    if (openB) {
      out += '</b>'
      openB = false
    }
  }
  for (const seg of segs) {
    if (seg.br) {
      closeAll()
      out += '\n'
      continue
    }
    if (openB !== seg.b || openU !== seg.u || openS !== seg.s) {
      closeAll()
      if (seg.b) {
        out += '<b>'
        openB = true
      }
      if (seg.u) {
        out += '<u>'
        openU = true
      }
      if (seg.s) {
        out += '<s>'
        openS = true
      }
    }
    out += escapeHtml(seg.text)
  }
  closeAll()
  return out.replace(/\n+$/, '')
}

/**
 * Sanitiza el HTML proveniente del contenteditable.
 * Conserva texto, saltos de línea y etiquetas <b>, <u>, <s>.
 * Normaliza <strong>→<b>, <strike>/<del>→<s>, y spans con text-decoration o
 * font-weight inline a sus equivalentes semánticos.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  // Camino preferido: walker DOM que entiende inline styles.
  const domNormalized = normalizeViaDOM(html)
  if (domNormalized !== null) return domNormalized

  // Fallback regex (entornos sin DOM, ej. node).

  let normalized = html
    .replace(/<strong(\s[^>]*)?>/gi, '<b>')
    .replace(/<\/strong>/gi, '</b>')
    .replace(/<(strike|del)(\s[^>]*)?>/gi, '<s>')
    .replace(/<\/(strike|del)>/gi, '</s>')

  // Normalizar saltos de bloque → \n antes de strip.
  normalized = normalized
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/(div|p|h[1-6]|li)>/gi, '\n')
    .replace(/<(div|p|h[1-6]|li)(\s[^>]*)?>/gi, '')

  normalized = normalized.replace(/&nbsp;/g, ' ')

  // Eliminar cualquier etiqueta que no sea <b>, <u>, <s> (con o sin /).
  normalized = normalized.replace(/<(?!\/?(b|u|s)(\s|>|\/))[^>]+>/gi, '')

  // Quitar atributos de <b>, <u>, <s>.
  normalized = normalized.replace(/<(b|u|s)\s[^>]*>/gi, (_, tag) => `<${tag}>`)

  // Colapsar tags vacíos y duplicados consecutivos para cada decoración.
  for (const tag of ['b', 'u', 's']) {
    const empty = new RegExp(`<${tag}>\\s*<\\/${tag}>`, 'gi')
    const dupe = new RegExp(`<\\/${tag}>\\s*<${tag}>`, 'gi')
    normalized = normalized.replace(empty, '').replace(dupe, '')
  }

  return normalized
}

/**
 * Convierte el HTML normalizado en una lista de líneas con sus runs.
 */
export const parseRuns = (html: string): RichTextLine[] => {
  const safe = sanitizeHtml(html || '')
  if (!safe) return [{ runs: [{ text: '', bold: false, underline: false, strikethrough: false }] }]

  const lines: RichTextLine[] = []
  let currentRuns: RichTextRun[] = []
  let bold = false
  let underline = false
  let strikethrough = false
  let buffer = ''

  const flushBuffer = () => {
    if (buffer.length === 0) return
    const decoded = buffer
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    currentRuns.push({ text: decoded, bold, underline, strikethrough })
    buffer = ''
  }

  const flushLine = () => {
    flushBuffer()
    if (currentRuns.length === 0) {
      currentRuns.push({ text: '', bold: false, underline: false, strikethrough: false })
    }
    lines.push({ runs: currentRuns })
    currentRuns = []
  }

  const tokenRegex = /<\/?[bus]>|\n/gi
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(safe)) !== null) {
    buffer += safe.slice(lastIndex, match.index)
    const token = match[0].toLowerCase()
    if (token === '<b>') {
      flushBuffer()
      bold = true
    } else if (token === '</b>') {
      flushBuffer()
      bold = false
    } else if (token === '<u>') {
      flushBuffer()
      underline = true
    } else if (token === '</u>') {
      flushBuffer()
      underline = false
    } else if (token === '<s>') {
      flushBuffer()
      strikethrough = true
    } else if (token === '</s>') {
      flushBuffer()
      strikethrough = false
    } else if (token === '\n') {
      flushLine()
    }
    lastIndex = match.index + match[0].length
  }

  buffer += safe.slice(lastIndex)
  flushLine()

  return lines
}

/**
 * Convierte el HTML a texto plano (sin etiquetas), preservando saltos de línea.
 */
export const htmlToPlain = (html: string): string =>
  parseRuns(html)
    .map((line) => line.runs.map((r) => r.text).join(''))
    .join('\n')

/** Regex para detectar placeholders {var} en el HTML/plantilla. */
const VARIABLE_REGEX = /\{([^{}\s][^{}]*)\}/g

/**
 * Extrae los nombres únicos de variables del HTML plantilla, preservando el
 * orden de aparición.
 */
export const extractVariableNames = (html: string): string[] => {
  if (!html) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const match of html.matchAll(VARIABLE_REGEX)) {
    const name = match[1].trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    result.push(name)
  }
  return result
}

/**
 * Sustituye los placeholders {var} en el HTML por sus valores escapados.
 * - Por defecto, los placeholders sin valor se eliminan (igual que pdfme nativo).
 * - Si se pasa `fallback`, se invoca con el nombre de la variable cuando no
 *   haya valor y se utiliza el resultado (ya escapado).
 */
export const substituteVariables = (html: string, values: Record<string, string> | undefined | null, fallback?: (variableName: string) => string): string => {
  if (!html) return ''
  const safeValues = values || {}
  return html.replace(VARIABLE_REGEX, (_, rawName: string) => {
    const name = rawName.trim()
    const value = safeValues[name]
    if (value !== undefined && value !== null && value !== '') {
      return escapeHtml(String(value))
    }
    if (fallback) return escapeHtml(fallback(name))
    return ''
  })
}

/**
 * Parsea el `value` (content) y devuelve un objeto con los valores de cada
 * variable. Si `value` no es un JSON válido, devuelve un objeto vacío.
 */
export const parseVariableValues = (value: string | undefined | null): Record<string, string> => {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch {
    // value no es JSON; lo ignoramos.
  }
  return {}
}
