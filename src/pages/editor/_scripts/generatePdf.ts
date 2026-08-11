import { toast } from '@/scripts/toast'
import { handleGeneratePdf } from '@/pdfme/utils.js'
import { getInputFromTemplate } from '@pdfme/common'
import type { EditorContext } from './types'
import { buildOutOfBoundsMessage, findFieldsOutOfPrintableArea } from './validation'

export function setupGeneratePdf(ctx: EditorContext, plugins: any, fonts: any) {
  const generatePdfBtn = document.getElementById('generatePdfBtn')
  if (!generatePdfBtn) return

  generatePdfBtn.addEventListener('click', async () => {
    try {
      if (!ctx.state.designer) {
        throw new Error('Designer no está inicializado')
      }
      const { template: fullTemplate } = ctx.getOutputTemplate()
      const outOfBounds = findFieldsOutOfPrintableArea(fullTemplate?.schemas ?? [], fullTemplate?.basePdf)
      if (outOfBounds.length) {
        toast.warn(buildOutOfBoundsMessage(outOfBounds, `No se puede visualizar el documento: ${outOfBounds.length} campo(s) quedaron fuera del margen:`), { duration: 8000 })
        return
      }
      const tmpDesigner = { getTemplate: () => fullTemplate } as any
      await handleGeneratePdf(tmpDesigner, getInputFromTemplate(fullTemplate), plugins, fonts)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      toast.error(`No se pudo visualizar el documento: ${detail}`)
    }
  })
}
