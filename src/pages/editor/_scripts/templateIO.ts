import { toast } from '@/scripts/toast'
import { downloadJsonFile, readJsonFile, toggleFullscreen, handleBasePdfChange } from '@/pdfme/utils.js'
import { PaginationManager } from '@/pdfme/pagination.js'
import type { EditorContext } from './types'

function getSchemaFileName(): string {
  const name = new URLSearchParams(window.location.search).get('name_document')?.trim()
  if (!name) return 'schema'
  return name.replace(/[<>:"/\\|?*]/g, '-').replace(/\s+/g, '_').slice(0, 80)
}

function isValidTemplate(template: unknown): template is { schemas: unknown[] } {
  return typeof template === 'object' && template !== null && Array.isArray((template as { schemas?: unknown }).schemas)
}

function closeSchemaIOModal() {
  const modal = document.getElementById('schema-io') as HTMLDialogElement | null
  modal?.close()
}

export function setupTemplateIO(ctx: EditorContext) {
  const basePdfInput = document.getElementById('basePdfInput')
  if (basePdfInput) {
    basePdfInput.addEventListener('change', (e) => {
      handleBasePdfChange(e, ctx.state.designer)
    })
  }

  const downloadTemplateBtn = document.getElementById('downloadTemplateBtn') as HTMLButtonElement
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', () => {
      try {
        if (!ctx.state.designer) {
          throw new Error('Designer no está inicializado')
        }
        const currentTemplate = ctx.getFullSyncedTemplate()
        if (!currentTemplate) {
          throw new Error('No hay schema para exportar')
        }
        downloadJsonFile(currentTemplate, getSchemaFileName())
        toast.success('Schema descargado')
      } catch {
        toast.error('Ha ocurrido un error al descargar el schema. Por favor, intente nuevamente.')
      }
    })
  }

  const loadTemplateBtn = document.getElementById('loadTemplateBtn') as HTMLButtonElement
  const uploadTemplateInput = document.getElementById('uploadTemplateInput') as HTMLInputElement

  if (loadTemplateBtn && uploadTemplateInput) {
    loadTemplateBtn.addEventListener('click', () => {
      uploadTemplateInput.click()
    })

    uploadTemplateInput.addEventListener('change', async (e) => {
      const inputElement = e.target as HTMLInputElement
      const file = inputElement.files?.[0] as File
      if (!file) return

      try {
        const loadedTemplate = await readJsonFile(file)
        if (!isValidTemplate(loadedTemplate)) {
          throw new Error('El archivo no contiene un schema válido.')
        }
        if (ctx.state.designer) {
          ctx.state.pagination = new PaginationManager(loadedTemplate as any)
          const tpl = ctx.state.pagination.isSingleChunk ? loadedTemplate : ctx.state.pagination.getChunkedTemplate()
          ctx.state.designer.updateTemplate(tpl as any)
          ctx.markDirty()
          ctx.state.updatePaginationUI()
        }
        toast.success('Schema cargado correctamente')
        closeSchemaIOModal()
      } catch (err) {
        toast.error(`Error al cargar el schema:\n${err}`)
      } finally {
        inputElement.value = ''
      }
    })
  }

  const toggleFullscreenBtn = document.getElementById('toggleFullscreenBtn') as HTMLButtonElement
  if (toggleFullscreenBtn) {
    toggleFullscreenBtn.addEventListener('click', toggleFullscreen)
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && document.body.classList.contains('editor-fullscreen')) {
      toggleFullscreen()
    }
  })
}
