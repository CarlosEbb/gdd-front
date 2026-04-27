import type { PDFRenderProps } from '@pdfme/common'
import type { RichTextSchema, RichTextRun } from './types'
import { parseRuns, substituteVariables, parseVariableValues } from './helper'

const looksLikeJson = (s: string): boolean => {
  const trimmed = s.trim()
  return trimmed.startsWith('{') && trimmed.endsWith('}') && /"\s*:/.test(trimmed)
}

// pdfme usa un fork propio de pdf-lib, por lo que se utiliza `any` para la
// fuente embebida y se construye el color RGB manualmente evitando choques
// de tipos con el paquete `pdf-lib` estándar.
type EmbeddedFont = {
  widthOfTextAtSize: (text: string, size: number) => number
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = (hex || '#000000').replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0')
  const intVal = parseInt(full.slice(0, 6), 16)
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  }
}

const embedFontCached = async (arg: PDFRenderProps<RichTextSchema>, fontName: string): Promise<EmbeddedFont> => {
  const { pdfDoc, options, _cache } = arg as PDFRenderProps<RichTextSchema> & {
    _cache: Map<string, unknown>
  }
  const cacheKey = `richText-font-${fontName}`
  if (_cache && _cache.has(cacheKey)) {
    return _cache.get(cacheKey) as EmbeddedFont
  }

  const fontOptions = (options as any)?.font as Record<string, { data: ArrayBuffer | Uint8Array | string }> | undefined
  const fontEntry = fontOptions?.[fontName]
  if (!fontEntry) {
    throw new Error(`[richText] Fuente "${fontName}" no encontrada en options.font`)
  }

  const embedded = (await (pdfDoc as any).embedFont(fontEntry.data as ArrayBuffer, { subset: true })) as EmbeddedFont
  if (_cache) _cache.set(cacheKey, embedded)
  return embedded
}

const wrapRuns = (runs: RichTextRun[], fonts: { regular: EmbeddedFont; bold: EmbeddedFont }, fontSize: number, maxWidth: number): RichTextRun[][] => {
  const lines: RichTextRun[][] = []
  let current: RichTextRun[] = []
  let currentWidth = 0

  const getFont = (bold: boolean) => (bold ? fonts.bold : fonts.regular)

  const measure = (text: string, bold: boolean) => getFont(bold).widthOfTextAtSize(text, fontSize)

  const pushToken = (text: string, bold: boolean, underline: boolean, strikethrough: boolean) => {
    if (!text) return
    const w = measure(text, bold)
    const last = current[current.length - 1]
    if (last && last.bold === bold && !!last.underline === underline && !!last.strikethrough === strikethrough) {
      last.text += text
    } else {
      current.push({ text, bold, underline, strikethrough })
    }
    currentWidth += w
  }

  const breakLine = () => {
    lines.push(current)
    current = []
    currentWidth = 0
  }

  for (const run of runs) {
    const u = !!run.underline
    const s = !!run.strikethrough
    // Dividir el run en tokens (palabras + espacios) conservando espacios.
    const tokens = run.text.match(/\s+|\S+/g) || []
    for (const token of tokens) {
      const tokenWidth = measure(token, run.bold)
      if (currentWidth + tokenWidth <= maxWidth || currentWidth === 0) {
        pushToken(token, run.bold, u, s)
      } else {
        breakLine()
        // No iniciar línea con espacios.
        if (/^\s+$/.test(token)) continue
        pushToken(token, run.bold, u, s)
      }
    }
  }
  breakLine()
  return lines
}

const measureLine = (runs: RichTextRun[], fonts: { regular: EmbeddedFont; bold: EmbeddedFont }, fontSize: number): number =>
  runs.reduce((acc, r) => acc + (r.bold ? fonts.bold : fonts.regular).widthOfTextAtSize(r.text, fontSize), 0)

export const pdfRender = async (arg: PDFRenderProps<RichTextSchema>) => {
  const { value, schema, page } = arg
  const {
    width,
    height,
    position,
    fontSize,
    fontName,
    fontNameBold,
    lineHeight = 1.2,
    fontColor = '#000000',
    alignment = 'left',
    verticalAlignment = 'top',
    underline = false,
    strikethrough = false,
  } = schema

  // Resolver la plantilla:
  // - Prefiere `schema.text` (formato nuevo).
  // - Si no existe, cae al `value` cuando es HTML directo (legacy richText).
  // - Si `value` parece JSON, asumimos plantilla con variables y `value` lleva
  //   los valores; en ese caso `schema.text` debería existir.
  const valueIsJson = typeof value === 'string' && looksLikeJson(value)
  const template = typeof schema.text === 'string' && schema.text.length > 0 ? schema.text : typeof value === 'string' && !valueIsJson ? value : ''

  if (!template) return

  const variables = Array.isArray(schema.variables) ? schema.variables : []
  const values = variables.length > 0 ? parseVariableValues(value) : {}
  const html = variables.length > 0 ? substituteVariables(template, values) : template

  const [regular, bold] = await Promise.all([embedFontCached(arg, fontName), embedFontCached(arg, fontNameBold)])
  const fonts = { regular, bold }

  const mmToPt = (mm: number) => mm * 2.8346456692913
  const maxWidthPt = mmToPt(width)
  const boxHeightPt = mmToPt(height)
  const xPt = mmToPt(position.x)
  const yTopPt = page.getHeight() - mmToPt(position.y)

  const sourceLines = parseRuns(html)
  const wrapped: RichTextRun[][] = []
  for (const line of sourceLines) {
    const wrappedLine = wrapRuns(line.runs, fonts, fontSize, maxWidthPt)
    for (const w of wrappedLine) wrapped.push(w)
  }

  const { r, g, b } = hexToRgb(fontColor)
  // Construcción manual del color RGB compatible con el fork @pdfme/pdf-lib.
  const color = { type: 'RGB', red: r, green: g, blue: b } as any
  const lineStepPt = fontSize * lineHeight

  // Altura total ocupada por el texto (sin exceder la caja).
  const visibleLines = Math.min(wrapped.length, Math.max(1, Math.floor(boxHeightPt / lineStepPt)))
  const totalTextHeight = visibleLines * lineStepPt

  // Offset vertical inicial según verticalAlignment.
  let topOffset = 0
  if (verticalAlignment === 'middle') topOffset = (boxHeightPt - totalTextHeight) / 2
  else if (verticalAlignment === 'bottom') topOffset = boxHeightPt - totalTextHeight

  let cursorY = yTopPt - topOffset - fontSize

  for (let lineIdx = 0; lineIdx < wrapped.length; lineIdx++) {
    const lineRuns = wrapped[lineIdx]
    if (yTopPt - topOffset - cursorY > boxHeightPt) break

    const lineWidth = measureLine(lineRuns, fonts, fontSize)
    let offsetX = xPt
    let extraSpacePerGap = 0
    const isLastLine = lineIdx === wrapped.length - 1

    if (alignment === 'center') offsetX = xPt + (maxWidthPt - lineWidth) / 2
    else if (alignment === 'right') offsetX = xPt + (maxWidthPt - lineWidth)
    else if (alignment === 'justify' && !isLastLine) {
      // Contar espacios presentes en los runs para distribuir el sobrante.
      const spaceCount = lineRuns.reduce((acc, r) => acc + (r.text.match(/ /g)?.length || 0), 0)
      if (spaceCount > 0) extraSpacePerGap = (maxWidthPt - lineWidth) / spaceCount
    }

    let runX = offsetX
    for (const run of lineRuns) {
      if (!run.text) continue
      const font = run.bold ? bold : regular

      let textToDraw = run.text
      let runWidth = font.widthOfTextAtSize(textToDraw, fontSize)

      if (extraSpacePerGap > 0) {
        // Dibujar palabra por palabra insertando el espacio extra.
        const parts = run.text.split(' ')
        let localX = runX
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          if (part) {
            ;(page as any).drawText(part, { x: localX, y: cursorY, size: fontSize, font, color })
            localX += font.widthOfTextAtSize(part, fontSize)
          }
          if (i < parts.length - 1) {
            // Espacio + gap extra.
            localX += font.widthOfTextAtSize(' ', fontSize) + extraSpacePerGap
          }
        }
        runWidth = localX - runX
      } else {
        ;(page as any).drawText(textToDraw, { x: runX, y: cursorY, size: fontSize, font, color })
      }

      // Subrayado/tachado por-run (misma API que el plugin text nativo).
      const runUnderline = !!run.underline || underline
      const runStrike = !!run.strikethrough || strikethrough
      const thickness = (1 / 12) * fontSize
      if (runStrike && runWidth > 0) {
        const lineY = cursorY + fontSize / 3
        ;(page as any).drawLine({
          start: { x: runX, y: lineY },
          end: { x: runX + runWidth, y: lineY },
          thickness,
          color,
        })
      }
      if (runUnderline && runWidth > 0) {
        const lineY = cursorY - fontSize / 12
        ;(page as any).drawLine({
          start: { x: runX, y: lineY },
          end: { x: runX + runWidth, y: lineY },
          thickness,
          color,
        })
      }

      runX += runWidth
    }

    cursorY -= lineStepPt
  }
}
