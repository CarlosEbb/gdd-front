import type { UIRenderProps } from '@pdfme/common'
import type { RichTextSchema } from './types'
import { sanitizeHtml } from './helper'

const getEffectiveScale = (element: HTMLElement | null): number => {
  let scale = 1
  let el = element
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el)
    const transform = style.transform
    if (transform && transform !== 'none') {
      const match = transform.match(/matrix\((.+)\)/)
      if (match) {
        const localScale = parseFloat(match[1].split(', ')[3] || '1')
        if (!Number.isNaN(localScale)) scale *= localScale
      }
    }
    el = el.parentElement
  }
  return scale
}

const createToolbar = (onBold: () => void): HTMLElement => {
  const toolbar = document.createElement('div')
  toolbar.setAttribute('data-rich-text-toolbar', 'true')
  toolbar.style.position = 'absolute'
  toolbar.style.top = '-32px'
  toolbar.style.left = '0'
  toolbar.style.display = 'none'
  toolbar.style.zIndex = '10'
  toolbar.style.background = '#1f2937'
  toolbar.style.borderRadius = '4px'
  toolbar.style.padding = '2px'
  toolbar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)'

  const boldBtn = document.createElement('button')
  boldBtn.type = 'button'
  boldBtn.textContent = 'B'
  boldBtn.title = 'Negrita (Ctrl+B)'
  boldBtn.style.fontWeight = 'bold'
  boldBtn.style.color = '#fff'
  boldBtn.style.background = 'transparent'
  boldBtn.style.border = 'none'
  boldBtn.style.cursor = 'pointer'
  boldBtn.style.padding = '4px 10px'
  boldBtn.style.fontSize = '14px'
  boldBtn.style.borderRadius = '3px'
  boldBtn.addEventListener('mousedown', (e) => {
    // Evitar que el editor pierda el foco antes de ejecutar el comando.
    e.preventDefault()
    onBold()
  })

  toolbar.appendChild(boldBtn)
  return toolbar
}

export const uiRender = async (arg: UIRenderProps<RichTextSchema>) => {
  const { schema, value, onChange, rootElement, mode } = arg

  rootElement.style.position = 'relative'
  rootElement.style.display = 'flex'
  rootElement.style.flexDirection = 'column'
  const vAlign = schema.verticalAlignment || 'top'
  rootElement.style.justifyContent = vAlign === 'middle' ? 'center' : vAlign === 'bottom' ? 'flex-end' : 'flex-start'

  const editor = document.createElement('div')
  const isReadOnly = mode === 'viewer' || (mode === 'form' && !!schema.readOnly)

  editor.setAttribute('contenteditable', isReadOnly ? 'false' : 'true')
  editor.setAttribute('data-rich-text-editor', 'true')
  editor.style.width = '100%'
  editor.style.boxSizing = 'border-box'
  editor.style.outline = 'none'
  editor.style.whiteSpace = 'pre-wrap'
  editor.style.wordBreak = 'break-word'
  editor.style.overflow = 'hidden'
  editor.style.fontSize = `${schema.fontSize}px`
  editor.style.fontFamily = schema.fontName || 'sans-serif'
  editor.style.color = schema.fontColor || '#000000'
  editor.style.textAlign = schema.alignment || 'left'
  editor.style.lineHeight = String(schema.lineHeight ?? 1.2)

  // Composición de text-decoration (subrayado + tachado).
  const decorations: string[] = []
  if (schema.underline) decorations.push('underline')
  if (schema.strikethrough) decorations.push('line-through')
  editor.style.textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none'

  const resetScale = 1 / getEffectiveScale(rootElement)
  if (resetScale !== 1) {
    editor.style.transform = `scale(${resetScale})`
    editor.style.transformOrigin = 'top left'
    editor.style.width = `${100 / resetScale}%`
    editor.style.height = `${100 / resetScale}%`
  }

  editor.innerHTML = sanitizeHtml(value || '')

  rootElement.appendChild(editor)

  if (isReadOnly) return

  // Evitar que los clicks y el arrastre dentro del editor sean capturados
  // por el contenedor draggable de pdfme (de lo contrario el contenteditable
  // nunca recibe el foco real y no se puede escribir). Solo se aplica en
  // modos editables para no bloquear la selección del campo en viewer.
  editor.addEventListener('mousedown', (e) => e.stopPropagation())
  editor.addEventListener('pointerdown', (e) => e.stopPropagation())

  // Modo designer = el usuario hizo doble clic en el campo. Enfocamos el
  // editor automáticamente y colocamos el cursor al final para permitir
  // escribir de inmediato sin un clic adicional.
  if (mode === 'designer') {
    requestAnimationFrame(() => {
      editor.focus()
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        range.selectNodeContents(editor)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    })
  }

  const commitChange = () => {
    const sanitized = sanitizeHtml(editor.innerHTML)
    onChange && onChange({ key: 'content', value: sanitized })
  }

  const toolbar = createToolbar(() => {
    editor.focus()
    document.execCommand('bold')
    // No se emite onChange aquí para no forzar un re-render que pierda el
    // cursor mientras el usuario sigue escribiendo. El valor se persistirá
    // al perder foco.
  })
  rootElement.appendChild(toolbar)

  const showToolbar = () => {
    toolbar.style.display = 'block'
  }
  const hideToolbar = () => {
    toolbar.style.display = 'none'
  }

  editor.addEventListener('focus', showToolbar)
  editor.addEventListener('blur', (e) => {
    const related = e.relatedTarget as HTMLElement | null
    if (related && toolbar.contains(related)) return
    hideToolbar()
    commitChange()
  })

  editor.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      document.execCommand('bold')
    }
  })

  // Evitar pegado con formato externo.
  editor.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData?.getData('text/plain') || ''
    document.execCommand('insertText', false, text)
  })
}
