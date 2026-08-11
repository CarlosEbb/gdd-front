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

function createEditorContext(domContainer: HTMLElement): EditorContext {
  const state: EditorState = {
    designer: undefined,
    pagination: undefined,
    isSyncingTemplate: false,
    pendingTemplateUpdate: null,
    updatePaginationUI: () => {},
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
  }
}

async function initializeEditor(ctx: EditorContext, schemaFile: any) {
  const fonts = await initializeFonts()

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

  const pagination = setupPagination(ctx)
  pagination.bindControls()

  setupGeneratePdf(ctx, plugins, fonts)
  setupTemplateIO(ctx)
  setupMobileActions(ctx, ctx.state.designer, plugins, fonts)
  setupDocumentSettings(ctx)
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

  const ctx = createEditorContext(domContainer)

  setupDeleteDocument()
  setupSaveDocument(ctx)

  initializeEditor(ctx, schemaFile).catch(() => {
    toast.error('Ha ocurrido un error al inicializar el editor. Por favor, intente nuevamente.')
  })
}
