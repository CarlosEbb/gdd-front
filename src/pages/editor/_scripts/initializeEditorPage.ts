import { getComputedColorInHex } from '@/scripts/color-utils.js'
import { toast } from '@/scripts/toast'
import { initializeFonts } from '@/pdfme/utils.js'
import { text, multiVariableText, table, line, rectangle, ellipse, image, svg } from '@pdfme/schemas'
import { signature } from '@/pdfme/plugins/signature'
import { richText } from '@/pdfme/plugins/richText'
import { Designer } from '@pdfme/ui'
import { BLANK_A4_PDF } from '@pdfme/common'
import { PaginationManager } from '@/pdfme/pagination.js'
import type { EditorContext, EditorState, OutputTemplateResult } from './types'
import { setupPagination } from './pagination'
import { setupDocumentSettings } from './documentSettings'
import { setupSaveDocument } from './saveDocument'
import { setupGeneratePdf } from './generatePdf'
import { setupMobileActions } from './mobileActions'
import { setupDeleteDocument } from './deleteDocument'
import { setupTemplateIO } from './templateIO'
import { setupUnsavedChanges } from './unsavedChanges'

const mountedContainers = new WeakSet<HTMLElement>()
let sessionAbort: AbortController | null = null
let activeDesigner: Designer | null = null
let mountObserver: MutationObserver | null = null
let isWatchingDocument = false

function destroyActiveDesigner() {
  const designer = activeDesigner
  activeDesigner = null
  if (!designer) return
  try {
    designer.destroy()
  } catch {
    // El contenedor puede haber salido del DOM durante la transición
  }
}

function startEditorSession(): AbortSignal {
  sessionAbort?.abort()
  sessionAbort = new AbortController()
  return sessionAbort.signal
}

function waitForContainerLayout(container: HTMLElement, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    let frames = 0

    const step = () => {
      if (signal.aborted || !container.isConnected || frames >= 60) {
        resolve()
        return
      }
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        resolve()
        return
      }
      frames += 1
      requestAnimationFrame(step)
    }

    step()
  })
}

function createEditorContext(domContainer: HTMLElement): EditorContext {
  const state: EditorState = {
    designer: undefined,
    pagination: undefined,
    isSyncingTemplate: false,
    pendingTemplateUpdate: null,
    isDirty: false,
    isReady: false,
    updatePaginationUI: () => {},
  }

  const markDirty = () => {
    if (!state.isReady) return
    state.isDirty = true
  }

  const clearDirty = () => {
    state.isDirty = false
  }

  const withSyncing = (fn: () => void) => {
    state.isSyncingTemplate = true
    try {
      fn()
    } finally {
      state.isSyncingTemplate = false
    }
  }

  const getFullSyncedTemplate = () => {
    if (!state.designer) return null
    if (!state.pagination || state.pagination.isSingleChunk) {
      return state.designer.getTemplate()
    }
    state.pagination.syncFromDesigner(state.designer.getTemplate().schemas)
    return state.pagination.getFullTemplate()
  }

  const getOutputTemplate = (): OutputTemplateResult => {
    if (!state.designer) {
      throw new Error('Designer no está inicializado')
    }
    if (!state.pagination) {
      return { template: state.designer.getTemplate(), renamed: [] }
    }
    return state.pagination.getOutputTemplate(state.designer.getTemplate().schemas) as OutputTemplateResult
  }

  const syncEditorWithOutputTemplate = (template: any) => {
    if (!template || !state.designer || !state.pagination) return

    state.pagination.applyOutputTemplate(template)
    const currentTemplate = state.pagination.isSingleChunk ? template : state.pagination.getChunkedTemplate()

    withSyncing(() => {
      state.designer!.updateTemplate(currentTemplate as any)
    })

    state.updatePaginationUI()
  }

  return {
    state,
    domContainer,
    getFullSyncedTemplate,
    getOutputTemplate,
    syncEditorWithOutputTemplate,
    withSyncing,
    markDirty,
    clearDirty,
  }
}

async function initializeEditor(ctx: EditorContext, schemaFile: any, signal: AbortSignal) {
  const fonts = await initializeFonts()
  if (signal.aborted || !ctx.domContainer.isConnected) return

  await waitForContainerLayout(ctx.domContainer, signal)
  if (signal.aborted || !ctx.domContainer.isConnected) return

  let template = schemaFile

  if (template === null) {
    template = {
      schemas: [{}],
      basePdf: BLANK_A4_PDF,
    }
  }

  if (template.basePdf === 'BLANK_PDF') {
    template.basePdf = BLANK_A4_PDF
  }

  const plugins = {
    text,
    multiVariableText,
    table,
    line,
    rectangle,
    ellipse,
    image,
    signature,
    richText,
    svg,
  }

  const primaryColor = getComputedColorInHex('--primary') || '#2c62db'

  ctx.state.pagination = new PaginationManager(template)
  const initialTemplate = ctx.state.pagination.isSingleChunk ? template : ctx.state.pagination.getChunkedTemplate()

  if (signal.aborted || !ctx.domContainer.isConnected) return

  ctx.state.designer = new Designer({
    domContainer: ctx.domContainer,
    template: initialTemplate,
    plugins,
    options: {
      lang: 'es',
      font: fonts,
      theme: {
        token: {
          colorPrimary: primaryColor,
        },
      },
    },
  })
  activeDesigner = ctx.state.designer

  if (signal.aborted) {
    destroyActiveDesigner()
    return
  }

  const pagination = setupPagination(ctx)
  pagination.bindControls()

  setupGeneratePdf(ctx, plugins, fonts)
  setupTemplateIO(ctx, signal)
  setupMobileActions(ctx, ctx.state.designer, plugins, fonts)
  setupDocumentSettings(ctx)
  requestAnimationFrame(() => {
    ctx.clearDirty()
    ctx.state.isReady = true
  })
}

export function initializeEditorPage() {
  const domContainer = document.getElementById('container')
  const schemaFileData = document.getElementById('schema-file-data')

  if (!(domContainer instanceof HTMLElement) || !schemaFileData) {
    console.error('No se encontró el contenedor o los datos del editor')
    return
  }

  let schemaFile: unknown = null
  try {
    schemaFile = JSON.parse(schemaFileData.textContent || 'null')
  } catch {
    console.error('No se pudo parsear el schema del documento')
    toast.error('Ha ocurrido un error al cargar los datos del documento.')
    return
  }

  const signal = startEditorSession()
  const ctx = createEditorContext(domContainer)

  setupDeleteDocument(ctx)
  setupSaveDocument(ctx, signal)
  setupUnsavedChanges(ctx)

  initializeEditor(ctx, schemaFile, signal).catch(() => {
    if (signal.aborted) return
    toast.error('Ha ocurrido un error al inicializar el editor. Por favor, intente nuevamente.')
  })
}

function disposeEditorSession() {
  sessionAbort?.abort()
  sessionAbort = null
  mountObserver?.disconnect()
  mountObserver = null
  destroyActiveDesigner()
}

function tryInitializeEditor(): boolean {
  if (!location.pathname.startsWith('/editor/')) return false

  const container = document.getElementById('container')
  const schema = document.getElementById('schema-file-data')
  if (!(container instanceof HTMLElement) || !schema) return false
  if (mountedContainers.has(container)) return true

  mountedContainers.add(container)
  initializeEditorPage()
  return true
}

function armEditorMount() {
  mountObserver?.disconnect()
  mountObserver = null
  if (!location.pathname.startsWith('/editor/')) return
  if (tryInitializeEditor()) return

  mountObserver = new MutationObserver(() => {
    if (tryInitializeEditor()) {
      mountObserver?.disconnect()
      mountObserver = null
    }
  })
  mountObserver.observe(document.body, { childList: true, subtree: true })
}

export function watchEditorDocument() {
  if (isWatchingDocument) return
  isWatchingDocument = true

  document.addEventListener('astro:before-swap', disposeEditorSession)
  document.addEventListener('astro:after-swap', armEditorMount)
  document.addEventListener('astro:page-load', armEditorMount)
  armEditorMount()
}
