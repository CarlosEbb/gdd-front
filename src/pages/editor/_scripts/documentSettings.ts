import { toast } from '@/scripts/toast'
import { PAPER_SIZES_MAP, MARGIN_PRESETS_MAP } from '@/constants/file-settings'
import type { DocumentSettings, EditorContext } from './types'
import { buildOutOfBoundsMessage, findFieldsOutOfPrintableArea } from './validation'

function getCurrentDocumentSettings(ctx: EditorContext): DocumentSettings {
  const defaults: DocumentSettings = { pageSize: 'A4', marginType: 'NORMAL', orientation: 'PORTRAIT' }
  const designerInstance = ctx.state.designer
  if (!designerInstance) return defaults
  const basePdf = designerInstance.getTemplate().basePdf as any
  if (!basePdf || typeof basePdf !== 'object' || typeof basePdf.width !== 'number' || typeof basePdf.height !== 'number') {
    return defaults
  }

  const { width, height, padding } = basePdf
  const orientation = width > height ? 'LANDSCAPE' : 'PORTRAIT'
  const [portraitW, portraitH] = orientation === 'LANDSCAPE' ? [height, width] : [width, height]

  let pageSize = defaults.pageSize
  for (const [name, dims] of Object.entries(PAPER_SIZES_MAP)) {
    if (Math.abs(dims.width - portraitW) < 0.5 && Math.abs(dims.height - portraitH) < 0.5) {
      pageSize = name
      break
    }
  }

  let marginType = defaults.marginType
  if (Array.isArray(padding) && padding.length === 4) {
    const [top, right, bottom, left] = padding
    for (const [name, m] of Object.entries(MARGIN_PRESETS_MAP)) {
      if (Math.abs(m.top - top) < 0.2 && Math.abs(m.right - right) < 0.2 && Math.abs(m.bottom - bottom) < 0.2 && Math.abs(m.left - left) < 0.2) {
        marginType = name
        break
      }
    }
  }

  return { pageSize, marginType, orientation }
}

function applyDocumentSettings(ctx: EditorContext, settings: DocumentSettings) {
  const { designer: designerInstance, pagination: paginationManager } = ctx.state
  if (!designerInstance || !paginationManager) return

  const size = PAPER_SIZES_MAP[settings.pageSize as keyof typeof PAPER_SIZES_MAP]
  const margins = MARGIN_PRESETS_MAP[settings.marginType as keyof typeof MARGIN_PRESETS_MAP]
  if (!size || !margins) {
    toast.error('Configuración inválida')
    return
  }

  let { width, height } = size
  if (settings.orientation === 'LANDSCAPE') {
    ;[width, height] = [height, width]
  }

  const padding = [margins.top, margins.right, margins.bottom, margins.left]
  const newBasePdf = { width, height, padding }

  const fullTpl = ctx.getFullSyncedTemplate() as any
  const fullSchemas = fullTpl?.schemas ?? designerInstance.getTemplate().schemas
  const outOfBounds = findFieldsOutOfPrintableArea(fullSchemas, newBasePdf)

  const currentSchemas = designerInstance.getTemplate().schemas
  const newTemplate = paginationManager.updateBasePdf(newBasePdf, currentSchemas)
  designerInstance.updateTemplate(newTemplate as any)
  ctx.state.updatePaginationUI()

  if (outOfBounds.length) {
    toast.error(buildOutOfBoundsMessage(outOfBounds, `Configuración aplicada, pero ${outOfBounds.length} campo(s) quedaron fuera del margen:`), { duration: 8000 })
  } else {
    toast.success('Configuración aplicada')
  }
}

export function setupDocumentSettings(ctx: EditorContext) {
  const modal = document.getElementById('document-settings') as HTMLDialogElement | null
  const form = document.getElementById('document-settings-form') as HTMLFormElement | null
  if (!modal || !form) return

  const pageSizeSelect = form.querySelector('select[name="pageSize"]') as HTMLSelectElement | null
  const marginTypeSelect = form.querySelector('select[name="marginType"]') as HTMLSelectElement | null
  const orientationSelect = form.querySelector('select[name="orientation"]') as HTMLSelectElement | null
  if (!pageSizeSelect || !marginTypeSelect || !orientationSelect) return

  const hydrate = () => {
    const settings = getCurrentDocumentSettings(ctx)
    pageSizeSelect.value = settings.pageSize
    marginTypeSelect.value = settings.marginType
    orientationSelect.value = settings.orientation
  }

  document.querySelectorAll('[data-open-modal="document-settings"], [data-mobile-action="document-settings"]').forEach((trigger) => {
    trigger.addEventListener('click', hydrate)
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(form)
    applyDocumentSettings(ctx, {
      pageSize: (data.get('pageSize') as string) || 'A4',
      marginType: (data.get('marginType') as string) || 'NORMAL',
      orientation: (data.get('orientation') as string) || 'PORTRAIT',
    })
    modal.close()
  })
}
