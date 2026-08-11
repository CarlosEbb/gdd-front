import { toast } from '@/scripts/toast'
import { handleGeneratePdf, toggleFullscreen } from '@/pdfme/utils.js'
import { getInputFromTemplate } from '@pdfme/common'
import type { Designer } from '@pdfme/ui'
import type { EditorContext } from './types'
import { buildOutOfBoundsMessage, findFieldsOutOfPrintableArea } from './validation'

export function setupMobileActions(ctx: EditorContext, designer: Designer | undefined, plugins: any, fonts: any) {
  const mobileActions = document.querySelectorAll('[data-mobile-action]')
  const modalNewVersionDocument = document.getElementById('new-version-document') as HTMLDialogElement
  const modalDeleteDocument = document.getElementById('delete-document') as HTMLDialogElement
  const basePdfInput = document.getElementById('basePdfInput') as HTMLInputElement

  mobileActions.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = (btn as HTMLElement).dataset.mobileAction

      switch (action) {
        case 'new-version':
          modalNewVersionDocument?.showModal()
          break
        case 'generate-pdf':
          if (designer) {
            try {
              const { template: fullTpl } = ctx.getOutputTemplate()
              const outOfBounds = findFieldsOutOfPrintableArea(fullTpl?.schemas ?? [], fullTpl?.basePdf)
              if (outOfBounds.length) {
                toast.error(buildOutOfBoundsMessage(outOfBounds, `No se puede visualizar el documento: ${outOfBounds.length} campo(s) quedaron fuera del margen:`), { duration: 8000 })
                break
              }
              const tmpDes = { getTemplate: () => fullTpl } as any
              await handleGeneratePdf(tmpDes, getInputFromTemplate(fullTpl), plugins, fonts)
            } catch (error) {
              const detail = error instanceof Error ? error.message : String(error)
              toast.error(`No se pudo visualizar el documento: ${detail}`)
            }
          }
          break
        case 'fullscreen':
          toggleFullscreen()
          break
        case 'insert-pdf':
          basePdfInput?.click()
          break
        case 'delete':
          modalDeleteDocument?.showModal()
          break
        case 'document-settings': {
          const modal = document.getElementById('document-settings') as HTMLDialogElement | null
          modal?.showModal()
          break
        }
      }

      const dropdownMenu = btn.closest('[data-dropdown-menu]')
      const dropdownContainer = btn.closest('[data-dropdown-container]')
      if (dropdownMenu && dropdownContainer) {
        dropdownMenu.classList.remove('is-open')
        dropdownContainer.classList.remove('is-open')
      }
    })
  })
}
