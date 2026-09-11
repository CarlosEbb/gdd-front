import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker?worker'
import type { editor as MonacoEditor } from 'monaco-editor'

type Monaco = typeof import('monaco-editor')

type EditorEntry = {
  editor: MonacoEditor.IStandaloneCodeEditor
  root: HTMLElement
  intersection: IntersectionObserver
  resize: ResizeObserver
}

const editors = new Map<HTMLElement, EditorEntry>()
const pendingObservers = new Map<HTMLElement, IntersectionObserver>()
const creating = new Set<HTMLElement>()

let monacoModule: Monaco | null = null
let workersConfigured = false
let themeObserver: MutationObserver | null = null

type ThemeTokens = {
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  primary: string
}

const LIGHT_FALLBACK: ThemeTokens = {
  background: '#ffffff',
  foreground: '#171717',
  muted: '#f4f4f5',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  primary: '#4f2ae0',
}

const DARK_FALLBACK: ThemeTokens = {
  background: '#1f1f1f',
  foreground: '#ededed',
  muted: '#2a2a2a',
  mutedForeground: '#a3a3a3',
  border: '#3f3f3f',
  primary: '#7c6af7',
}

function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

function cssColorToHex(color: string, fallback: string): string {
  const value = color.trim()
  if (!value) return fallback

  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.slice(1)
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  const rgbMatch = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[,\s/]\s*(\d+(?:\.\d+)?)\s*[,\s/]\s*(\d+(?:\.\d+)?)(?:\s*[,\s/]\s*([\d.]+%?))?/i)
  if (rgbMatch) {
    const alphaRaw = rgbMatch[4]
    const alpha = alphaRaw == null ? 1 : alphaRaw.endsWith('%') ? Number(alphaRaw) / 100 : Number(alphaRaw)
    if (alpha < 0.2) return fallback
    return rgbToHex(Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3]))
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return fallback

  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a < 50) return fallback

  const hex = rgbToHex(r, g, b)
  const oklchMatch = value.match(/oklch\(\s*([\d.]+)%?/i)
  if (hex === '#000000' && oklchMatch) {
    const lightness = Number(oklchMatch[1])
    const normalized = lightness > 1 ? lightness / 100 : lightness
    if (normalized > 0.08) return fallback
  }

  return hex
}

function readCssVar(element: HTMLElement, variable: string, fallback: string): string {
  const raw = getComputedStyle(element).getPropertyValue(variable).trim()
  if (!raw) return fallback

  element.style.backgroundColor = raw
  const computed = getComputedStyle(element).backgroundColor
  element.style.backgroundColor = ''

  return cssColorToHex(computed, cssColorToHex(raw, fallback))
}

const LIGHT_CSS_VARS = {
  '--background': '#ffffff',
  '--heading': '#171717',
  '--muted': 'oklch(0.97 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--border': 'oklch(0.922 0 0)',
  '--primary': 'oklch(0.452 0.3132 264.05)',
} as const

const DARK_CSS_VARS = {
  '--background': '#1f1f1f',
  '--heading': '#ededed',
  '--muted': 'oklch(0.269 0 0)',
  '--muted-foreground': 'oklch(0.708 0 0)',
  '--border': '#3f3f3f',
  '--primary': 'oklch(0.452 0.3132 264.05)',
} as const

function readPalette(dark: boolean): ThemeTokens {
  const fallback = dark ? DARK_FALLBACK : LIGHT_FALLBACK
  const cssVars = dark ? DARK_CSS_VARS : LIGHT_CSS_VARS
  const probe = document.createElement('div')
  probe.style.cssText = 'position:absolute;left:-9999px;width:0;height:0;overflow:hidden;pointer-events:none'

  for (const [name, value] of Object.entries(cssVars)) {
    probe.style.setProperty(name, value)
  }

  document.body.appendChild(probe)

  const palette: ThemeTokens = {
    background: readCssVar(probe, '--background', fallback.background),
    foreground: readCssVar(probe, '--heading', fallback.foreground),
    muted: readCssVar(probe, '--muted', fallback.muted),
    mutedForeground: readCssVar(probe, '--muted-foreground', fallback.mutedForeground),
    border: readCssVar(probe, '--border', fallback.border),
    primary: readCssVar(probe, '--primary', fallback.primary),
  }

  probe.remove()
  return palette
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`
}

function configureWorkers() {
  if (workersConfigured) return
  workersConfigured = true

  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === 'json') return new jsonWorker()
      return new editorWorker()
    },
  }
}

function nativeTextareaValue(): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
}

function bindTextarea(
  textarea: HTMLTextAreaElement,
  getEditor: () => MonacoEditor.IStandaloneCodeEditor | undefined,
  syncLanguage: () => void,
) {
  const native = nativeTextareaValue()
  if (!native?.get || !native.set) return

  Object.defineProperty(textarea, 'value', {
    configurable: true,
    enumerable: true,
    get() {
      return getEditor()?.getValue() ?? native.get!.call(textarea)
    },
    set(next: string) {
      const value = next ?? ''
      native.set!.call(textarea, value)
      const instance = getEditor()
      if (instance && instance.getValue() !== value) {
        instance.setValue(value)
      }
      syncLanguage()
    },
  })
}

function themeColors(tokens: ThemeTokens) {
  return {
    'editor.background': tokens.background,
    'editor.foreground': tokens.foreground,
    'editorGutter.background': tokens.background,
    'editorLineNumber.foreground': tokens.mutedForeground,
    'editorLineNumber.activeForeground': tokens.foreground,
    'editor.lineHighlightBackground': tokens.muted,
    'editor.lineHighlightBorder': '#00000000',
    'editor.selectionBackground': withAlpha(tokens.primary, '33'),
    'editor.inactiveSelectionBackground': withAlpha(tokens.primary, '1a'),
    'editorCursor.foreground': tokens.primary,
    'editorWidget.background': tokens.background,
    'editorWidget.border': tokens.border,
    'editorWidget.foreground': tokens.foreground,
    'editorIndentGuide.background1': tokens.border,
    'editorIndentGuide.activeBackground1': tokens.mutedForeground,
    'editorBracketMatch.background': withAlpha(tokens.primary, '22'),
    'editorBracketMatch.border': tokens.primary,
    'scrollbarSlider.background': withAlpha(tokens.mutedForeground, '33'),
    'scrollbarSlider.hoverBackground': withAlpha(tokens.mutedForeground, '55'),
    focusBorder: tokens.primary,
  }
}

function defineThemes(monaco: Monaco) {
  const light = readPalette(false)
  const dark = readPalette(true)

  monaco.editor.defineTheme('gdd-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '1E66F5' },
      { token: 'string.value.json', foreground: '40A02B' },
      { token: 'string', foreground: '40A02B' },
      { token: 'number', foreground: 'FE640B' },
      { token: 'keyword', foreground: '8839EF' },
      { token: 'delimiter', foreground: '7C7F93' },
      { token: 'tag', foreground: '1E66F5' },
      { token: 'metatag', foreground: '7C7F93' },
      { token: 'attribute.name', foreground: 'DF8E1D' },
      { token: 'attribute.value', foreground: '40A02B' },
    ],
    colors: themeColors(light),
  })

  monaco.editor.defineTheme('gdd-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '89B4FA' },
      { token: 'string.value.json', foreground: 'A6E3A1' },
      { token: 'string', foreground: 'A6E3A1' },
      { token: 'number', foreground: 'FAB387' },
      { token: 'keyword', foreground: 'CBA6F7' },
      { token: 'delimiter', foreground: 'A6ADC8' },
      { token: 'tag', foreground: '89B4FA' },
      { token: 'metatag', foreground: 'A6ADC8' },
      { token: 'attribute.name', foreground: 'F9E2AF' },
      { token: 'attribute.value', foreground: 'A6E3A1' },
    ],
    colors: themeColors(dark),
  })
}

function applyTheme(monaco: Monaco) {
  defineThemes(monaco)
  monaco.editor.setTheme(isDarkTheme() ? 'gdd-dark' : 'gdd-light')
}

function watchTheme() {
  if (themeObserver) return

  themeObserver = new MutationObserver(() => {
    if (monacoModule) applyTheme(monacoModule)
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

async function loadMonaco(): Promise<Monaco> {
  if (monacoModule) return monacoModule

  configureWorkers()
  await import('../../node_modules/monaco-editor/min/vs/editor/editor.main.css')
  monacoModule = await import('monaco-editor')
  applyTheme(monacoModule)
  watchTheme()

  return monacoModule
}

function isVisible(element: HTMLElement): boolean {
  return element.getClientRects().length > 0
}

async function createEditor(root: HTMLElement) {
  const current = editors.get(root)
  if (current) {
    current.editor.layout()
    return
  }

  if (creating.has(root)) return

  const textarea = root.querySelector<HTMLTextAreaElement>('[data-code-editor-input]')
  const mount = root.querySelector<HTMLElement>('[data-code-editor-mount]')
  if (!textarea || !mount || !isVisible(mount)) return

  creating.add(root)

  try {
    const monaco = await loadMonaco()
    if (editors.has(root) || !isVisible(mount)) return

    const readOnly = root.dataset.readonly === 'true'
    let editor: MonacoEditor.IStandaloneCodeEditor | undefined

    const syncLanguage = () => {
      const language = root.dataset.language || 'plaintext'
      const model = editor?.getModel()
      if (!model) return
      if (model.getLanguageId() !== language) {
        monaco.editor.setModelLanguage(model, language)
      }
    }

    bindTextarea(textarea, () => editor, syncLanguage)

    editor = monaco.editor.create(mount, {
      value: nativeTextareaValue()?.get?.call(textarea) ?? textarea.value,
      language: root.dataset.language || 'plaintext',
      readOnly,
      domReadOnly: readOnly,
      minimap: { enabled: false },
      lineNumbers: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      padding: { top: 12, bottom: 12 },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      renderLineHighlight: readOnly ? 'none' : 'line',
      contextmenu: !readOnly,
      tabSize: 2,
      theme: isDarkTheme() ? 'gdd-dark' : 'gdd-light',
      ariaLabel: root.dataset.ariaLabel || textarea.name || 'Editor de código',
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
    })

    editor.onDidChangeModelContent(() => {
      nativeTextareaValue()?.set?.call(textarea, editor!.getValue())
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })

    const resize = new ResizeObserver(() => editor?.layout())
    resize.observe(root)

    const intersection = pendingObservers.get(root)
    if (intersection) pendingObservers.delete(root)

    editors.set(root, {
      editor,
      root,
      intersection: intersection ?? new IntersectionObserver(() => editor?.layout()),
      resize,
    })
  } finally {
    creating.delete(root)
  }
}

function bindEditor(root: HTMLElement) {
  if (root.dataset.codeEditorBound === 'true') return
  root.dataset.codeEditorBound = 'true'

  const intersection = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      void createEditor(root)
    }
  })

  pendingObservers.set(root, intersection)
  intersection.observe(root)
  if (isVisible(root)) void createEditor(root)
}

export function initCodeEditors() {
  document.querySelectorAll<HTMLElement>('[data-code-editor]').forEach(bindEditor)
}

export function disposeCodeEditors() {
  pendingObservers.forEach((observer, root) => {
    observer.disconnect()
    delete root.dataset.codeEditorBound
  })
  pendingObservers.clear()

  editors.forEach((entry) => {
    entry.editor.dispose()
    entry.resize.disconnect()
    entry.intersection.disconnect()
    delete entry.root.dataset.codeEditorBound
  })
  editors.clear()

  themeObserver?.disconnect()
  themeObserver = null
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposeCodeEditors()
  })
}
