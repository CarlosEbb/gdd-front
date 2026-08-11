import { toast } from '@/scripts/toast'
import { downloadJsonFile, readJsonFile, toggleFullscreen, handleBasePdfChange } from '@/pdfme/utils.js'
import { PaginationManager } from '@/pdfme/pagination.js'
import type { EditorContext } from './types'

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
        downloadJsonFile(currentTemplate, 'plantilla')
      } catch (error) {
        toast.error('Ah ocurrido un error al descargar la plantilla. Por favor, intente nuevamente.')
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
        if (ctx.state.designer) {
          ctx.state.pagination = new PaginationManager(loadedTemplate as any)
          const tpl = ctx.state.pagination.isSingleChunk ? loadedTemplate : ctx.state.pagination.getChunkedTemplate()
          ctx.state.designer.updateTemplate(tpl as any)
          ctx.state.updatePaginationUI()
        }
        toast.success('Plantilla cargada correctamente')
      } catch (err) {
        toast.error(`Error al cargar la plantilla:\n${err}`)
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
