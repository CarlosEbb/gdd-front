import type { UIRenderProps } from '@pdfme/common'
import type { RichTextSchema } from './types'
import { sanitizeHtml, extractVariableNames, substituteVariables, parseVariableValues } from './helper'

const applyEditorBaseStyles = (editor: HTMLElement, schema: RichTextSchema) => {
  editor.style.width = '100%'
  editor.style.boxSizing = 'border-box'
  editor.style.outline = 'none'
  editor.style.whiteSpace = 'pre-wrap'
  editor.style.wordBreak = 'break-word'
  editor.style.overflow = 'hidden'
  editor.style.fontSize = `${schema.fontSize}pt`
  editor.style.fontFamily = schema.fontName || 'sans-serif'
  editor.style.color = schema.fontColor || '#000000'
  editor.style.textAlign = schema.alignment || 'left'
  editor.style.lineHeight = String(schema.lineHeight ?? 1.2)

  // Compatibilidad legacy: si el schema tenía underline/strikethrough a nivel
  // global, se mantienen como decoración del contenedor. Las decoraciones
  // por-selección se aplican vía tags <u>/<s> dentro del HTML.
  const decorations: string[] = []
  if (schema.underline) decorations.push('underline')
  if (schema.strikethrough) decorations.push('line-through')
  editor.style.textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none'
}

const looksLikeJson = (s: string): boolean => {
  const trimmed = s.trim()
  return trimmed.startsWith('{') && trimmed.endsWith('}') && /"\s*:/.test(trimmed)
}

/**
 * Resuelve la plantilla HTML a partir del schema/value soportando schemas
 * legacy donde el HTML se almacenaba directamente en `content`.
 */
const resolveTemplate = (schema: RichTextSchema, value: string | undefined): string => {
  if (typeof schema.text === 'string' && schema.text.length > 0) return schema.text
  if (typeof value === 'string' && value.length > 0 && !looksLikeJson(value)) return value
  return ''
}

interface FormModeArgs {
  rootElement: HTMLElement
  schema: RichTextSchema
  template: string
  variables: string[]
  values: Record<string, string>
  onChange?: ((arg: { key: string; value: unknown } | { key: string; value: unknown }[]) => void) | undefined
}

const renderFormMode = ({ rootElement, schema, template, variables, values, onChange }: FormModeArgs) => {
  const container = document.createElement('div')
  container.setAttribute('data-rich-text-form', 'true')
  applyEditorBaseStyles(container, schema)

  const html = sanitizeHtml(template)
  const tokenRegex = /<\/?[bus]>|\n|\{[^{}]+\}/g
  let lastIndex = 0
  let bold = false
  let underline = false
  let strikethrough = false

  const applyDecorations = (node: HTMLElement, isBold: boolean, isUnderline: boolean, isStrike: boolean) => {
    if (isBold) node.style.fontWeight = 'bold'
    const decos: string[] = []
    if (isUnderline) decos.push('underline')
    if (isStrike) decos.push('line-through')
    if (decos.length > 0) node.style.textDecoration = decos.join(' ')
  }

  const appendText = (text: string, isBold: boolean, isUnderline: boolean, isStrike: boolean) => {
    if (!text) return
    const node = document.createElement('span')
    applyDecorations(node, isBold, isUnderline, isStrike)
    node.textContent = text
    container.appendChild(node)
  }

  const appendBreak = () => {
    container.appendChild(document.createElement('br'))
  }

  const persistValues = () => {
    const next: Record<string, string> = {}
    for (const v of variables) {
      const val = values[v]
      if (val !== undefined && val !== null) next[v] = val
    }
    if (onChange) onChange({ key: 'content', value: JSON.stringify(next) })
  }

  const appendVariableSpan = (variableName: string, isBold: boolean, isUnderline: boolean, isStrike: boolean) => {
    const span = document.createElement('span')
    span.setAttribute('contenteditable', 'true')
    span.setAttribute('data-variable', variableName)
    span.textContent = values[variableName] ?? ''
    span.style.outline = '1px dashed #1677ff'
    span.style.padding = '0 2px'
    span.style.minWidth = '8px'
    span.style.display = 'inline-block'
    applyDecorations(span, isBold, isUnderline, isStrike)

    span.addEventListener('mousedown', (e) => e.stopPropagation())
    span.addEventListener('pointerdown', (e) => e.stopPropagation())
    span.addEventListener('blur', () => {
      const newValue = span.textContent || ''
      if (values[variableName] !== newValue) {
        values[variableName] = newValue
        persistValues()
      }
    })
    container.appendChild(span)
  }

  let match: RegExpExecArray | null
  while ((match = tokenRegex.exec(html)) !== null) {
    const literal = html.slice(lastIndex, match.index)
    if (literal) appendText(literal, bold, underline, strikethrough)
    const token = match[0].toLowerCase()
    if (token === '<b>') bold = true
    else if (token === '</b>') bold = false
    else if (token === '<u>') underline = true
    else if (token === '</u>') underline = false
    else if (token === '<s>') strikethrough = true
    else if (token === '</s>') strikethrough = false
    else if (token === '\n') appendBreak()
    else if (token.startsWith('{') && token.endsWith('}')) {
      const variableName = token.slice(1, -1).trim()
      if (variables.includes(variableName)) appendVariableSpan(variableName, bold, underline, strikethrough)
      else appendText(token, bold, underline, strikethrough)
    }
    lastIndex = match.index + match[0].length
  }
  const tail = html.slice(lastIndex)
  if (tail) appendText(tail, bold, underline, strikethrough)

  rootElement.appendChild(container)
}

interface DesignerModeArgs {
  rootElement: HTMLElement
  schema: RichTextSchema
  template: string
  value: string | undefined
  onChange?: ((arg: { key: string; value: unknown } | { key: string; value: unknown }[]) => void) | undefined
  isReadOnly: boolean
}

const renderDesignerMode = ({ rootElement, schema, template, value, onChange, isReadOnly }: DesignerModeArgs) => {
  const editor = document.createElement('div')
  editor.setAttribute('contenteditable', isReadOnly ? 'false' : 'true')
  editor.setAttribute('data-rich-text-editor', 'true')
  applyEditorBaseStyles(editor, schema)

  editor.innerHTML = sanitizeHtml(template)
  rootElement.appendChild(editor)

  if (isReadOnly) return

  editor.addEventListener('mousedown', (e) => e.stopPropagation())
  editor.addEventListener('pointerdown', (e) => e.stopPropagation())

  // Foco automático en designer.
  requestAnimationFrame(() => {
    editor.focus()
    // Forzar que execCommand emita tags (<u>, <s>) en lugar de inline styles
    // — necesario para que sanitizeHtml/parseRuns puedan reconocerlos.
    try {
      document.execCommand('styleWithCSS', false, 'false')
    } catch {}
    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  })

  const wasLegacy = !schema.text && typeof value === 'string' && value.length > 0 && !looksLikeJson(value)

  const commitChange = () => {
    const sanitized = sanitizeHtml(editor.innerHTML)
    const newVars = extractVariableNames(sanitized)
    const updates: Array<{ key: string; value: unknown }> = [
      { key: 'text', value: sanitized },
      { key: 'variables', value: newVars },
    ]

    if (newVars.length > 0) {
      // Poda valores obsoletos y mantiene los existentes.
      const currentValues = parseVariableValues(value)
      const next: Record<string, string> = {}
      for (const v of newVars) {
        if (currentValues[v] !== undefined) next[v] = currentValues[v]
      }
      updates.push({ key: 'content', value: JSON.stringify(next) })
    } else if (wasLegacy || (typeof value === 'string' && looksLikeJson(value))) {
      // Migración legacy o sin variables: limpiar `content`.
      updates.push({ key: 'content', value: '' })
    }

    if (onChange) onChange(updates)
  }

  editor.addEventListener('blur', () => {
    commitChange()
  })

  editor.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      document.execCommand('bold')
    } else if (key === 'u') {
      e.preventDefault()
      document.execCommand('underline')
    }
  })

  editor.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') || ''
    document.execCommand('insertText', false, text)
  })
}

export const uiRender = async (arg: UIRenderProps<RichTextSchema>) => {
  const { schema, value, onChange, rootElement, mode } = arg

  rootElement.style.position = 'relative'
  rootElement.style.display = 'flex'
  rootElement.style.flexDirection = 'column'
  const vAlign = schema.verticalAlignment || 'top'
  rootElement.style.justifyContent = vAlign === 'middle' ? 'center' : vAlign === 'bottom' ? 'flex-end' : 'flex-start'

  const template = resolveTemplate(schema, value)
  const variables = Array.isArray(schema.variables) ? schema.variables : extractVariableNames(template)
  const hasVariables = variables.length > 0
  const values = hasVariables ? parseVariableValues(value) : {}

  const isFormMode = mode === 'form'
  const isViewer = mode === 'viewer'

  // Modo VIEWER (siempre) o FORM sin variables → render no editable.
  if (isViewer || (isFormMode && !hasVariables)) {
    const editor = document.createElement('div')
    editor.setAttribute('data-rich-text-editor', 'true')
    applyEditorBaseStyles(editor, schema)
    // En viewer (campo deseleccionado) las variables sin valor se muestran
    // como su nombre en MAYÚSCULAS para que el usuario las identifique en el
    // diseño en vez de desaparecer.
    const html = hasVariables ? substituteVariables(template, values, (name) => name.toUpperCase()) : sanitizeHtml(template)
    editor.innerHTML = sanitizeHtml(html)
    rootElement.appendChild(editor)
    return
  }

  // Modo FORM con variables → spans editables sólo para variables.
  if (isFormMode && hasVariables) {
    renderFormMode({ rootElement, schema, template, variables, values, onChange })
    return
  }

  // Modo DESIGNER → editar plantilla (texto + {var}).
  const isReadOnly = !!schema.readOnly
  renderDesignerMode({ rootElement, schema, template, value, onChange, isReadOnly })
}
