import { toast } from '@/scripts/toast'
import type { EditorContext } from './types'

export const STATIC_HEADER_TEXT_NAME = 'staticHeaderTitle'
export const STATIC_HEADER_LINE_NAME = 'staticHeaderLine'
export const STATIC_FOOTER_TEXT_NAME = 'staticFooterInfo'
export const STATIC_FOOTER_LINE_NAME = 'staticFooterLine'

export interface HeaderFooterConfig {
  enableHeader: boolean
  headerText: string
  headerAlignment: 'left' | 'center' | 'right'
  headerFontSize: number
  headerColor: string
  headerOffset: number
  headerLine: boolean

  enableFooter: boolean
  footerText: string
  footerAlignment: 'left' | 'center' | 'right'
  footerFontSize: number
  footerColor: string
  footerOffset: number
  footerLine: boolean
}

function isBlankBasePdf(basePdf: unknown): basePdf is { width: number; height: number; padding: [number, number, number, number]; staticSchema?: any[] } {
  return (
    typeof basePdf === 'object' &&
    basePdf !== null &&
    typeof (basePdf as any).width === 'number' &&
    typeof (basePdf as any).height === 'number'
  )
}

function isManagedItem(name: string): boolean {
  return (
    name === STATIC_HEADER_TEXT_NAME ||
    name === STATIC_HEADER_LINE_NAME ||
    name === STATIC_FOOTER_TEXT_NAME ||
    name === STATIC_FOOTER_LINE_NAME
  )
}

export function updateStaticSchemaUI(isEditing: boolean) {
  // Estado del body para alternar visualización de plugins con CSS
  if (isEditing) {
    document.body.setAttribute('data-editing-static-schema', 'true')
  } else {
    document.body.removeAttribute('data-editing-static-schema')
  }

  const desktopBtn = document.getElementById('btn-toggle-static-schema')
  if (desktopBtn) {
    desktopBtn.title = isEditing ? 'Terminar edición' : 'Editar encabezado y pie de página'
    desktopBtn.setAttribute('aria-pressed', String(isEditing))
    desktopBtn.classList.toggle('bg-primary', isEditing)
    desktopBtn.classList.toggle('text-white', isEditing)
    desktopBtn.classList.toggle('text-heading', !isEditing)
  }

  // Botón navbar mobile
  const mobileBtnText = document.getElementById('mobile-static-schema-text')
  if (mobileBtnText) {
    mobileBtnText.textContent = isEditing ? 'Terminar edición' : 'Esquema estático'
  }

  // Banner superior del canvas
  const banner = document.getElementById('static-schema-banner')
  if (banner) {
    if (isEditing) {
      banner.classList.remove('hidden')
      banner.classList.add('flex')
    } else {
      banner.classList.add('hidden')
      banner.classList.remove('flex')
    }
  }

  // Desactivar controles de paginación mientras se edita el esquema estático
  const paginationBar = document.getElementById('pagination-bar')
  const deletePageBtn = document.getElementById('pagination-delete-page')
  if (paginationBar) {
    paginationBar.classList.toggle('pointer-events-none', isEditing)
    paginationBar.classList.toggle('opacity-30', isEditing)
  }
  if (deletePageBtn) {
    deletePageBtn.classList.toggle('pointer-events-none', isEditing)
    deletePageBtn.classList.toggle('opacity-30', isEditing)
  }
}

export function toggleStaticSchemaMode(ctx: EditorContext) {
  const { state } = ctx
  const designer = state.designer
  if (!designer) return

  if (state.isEditingStaticSchema) {
    // SALIR DE MODO STATIC SCHEMA (End editing)
    const currentTemplateInDesigner = designer.getTemplate()
    if (!state.savedTemplateBeforeStatic) return

    const restoredTemplate = JSON.parse(JSON.stringify(state.savedTemplateBeforeStatic))
    if (!isBlankBasePdf(restoredTemplate.basePdf)) {
      toast.error('Formato inválido de basePdf')
      return
    }

    // El schema de la página 0 pasa a ser el staticSchema de basePdf
    const editedStaticElements: any[] = currentTemplateInDesigner.schemas[0] || []

    // Asegurar que elementos con expresiones tengan readOnly: true para que pdfme las evalúe
    const finalStaticSchema = editedStaticElements.map((item) => {
      if (typeof item?.content === 'string' && item.content.includes('{') && item.content.includes('}')) {
        return { ...item, readOnly: true }
      }
      return item
    })

    restoredTemplate.basePdf.staticSchema = finalStaticSchema

    if (state.pagination) {
      state.pagination.applyOutputTemplate(restoredTemplate)
      const currentTemplate = state.pagination.isSingleChunk
        ? restoredTemplate
        : state.pagination.getChunkedTemplate()

      ctx.withSyncing(() => {
        designer.updateTemplate(currentTemplate as any)
      })
    } else {
      ctx.withSyncing(() => {
        designer.updateTemplate(restoredTemplate as any)
      })
    }

    state.savedTemplateBeforeStatic = null
    state.isEditingStaticSchema = false
    ctx.markDirty()
    state.updatePaginationUI()
    updateStaticSchemaUI(false)
    toast.success('Edición de esquema estático finalizada. Los elementos se aplicarán en todas las páginas.')
  } else {
    // ENTRAR AL MODO STATIC SCHEMA
    const fullTemplate = ctx.getFullSyncedTemplate()
    if (!fullTemplate || !isBlankBasePdf(fullTemplate.basePdf)) {
      toast.error('La plantilla actual no permite editar esquemas estáticos (no es compatible con PDFs externos).')
      return
    }

    state.savedTemplateBeforeStatic = JSON.parse(JSON.stringify(fullTemplate))
    const { width, height } = fullTemplate.basePdf
    const staticElements = fullTemplate.basePdf.staticSchema || []

    ctx.withSyncing(() => {
      designer.updateTemplate({
        ...fullTemplate,
        schemas: [staticElements],
        basePdf: {
          width,
          height,
          padding: [0, 0, 0, 0],
        },
      } as any)
    })

    state.isEditingStaticSchema = true
    updateStaticSchemaUI(true)
    toast.info('Modo esquema estático activo. Edita encabezados y pies de página directamente en el lienzo.')
  }
}

function extractConfigFromTemplate(basePdf: any): { config: HeaderFooterConfig; isBlank: boolean } {
  const isBlank = isBlankBasePdf(basePdf)
  const staticSchema: any[] = isBlank && Array.isArray(basePdf.staticSchema) ? basePdf.staticSchema : []

  const topPadding = isBlank && Array.isArray(basePdf.padding) ? basePdf.padding[0] : 20
  const bottomPadding = isBlank && Array.isArray(basePdf.padding) ? basePdf.padding[2] : 20
  const defaultHeaderOffset = Math.max(4, Math.round(topPadding / 2 - 2))
  const defaultFooterOffset = Math.max(6, Math.round(bottomPadding / 2 + 2))

  const headerItem = staticSchema.find((item) => item.name === STATIC_HEADER_TEXT_NAME || item.name === 'headerText')
  const headerLineItem = staticSchema.find((item) => item.name === STATIC_HEADER_LINE_NAME || item.name === 'headerLine')
  const footerItem = staticSchema.find((item) => item.name === STATIC_FOOTER_TEXT_NAME || item.name === 'footerText')
  const footerLineItem = staticSchema.find((item) => item.name === STATIC_FOOTER_LINE_NAME || item.name === 'footerLine')

  const config: HeaderFooterConfig = {
    enableHeader: Boolean(headerItem),
    headerText: headerItem?.content ?? '',
    headerAlignment: (headerItem?.alignment as 'left' | 'center' | 'right') ?? 'left',
    headerFontSize: Number(headerItem?.fontSize) || 9,
    headerColor: headerItem?.fontColor ?? '#4d4d4d',
    headerOffset: headerItem?.position?.y != null ? Math.round(headerItem.position.y) : defaultHeaderOffset,
    headerLine: Boolean(headerLineItem),

    enableFooter: Boolean(footerItem),
    footerText: footerItem?.content ?? 'Página {currentPage} de {totalPages}',
    footerAlignment: (footerItem?.alignment as 'left' | 'center' | 'right') ?? 'center',
    footerFontSize: Number(footerItem?.fontSize) || 9,
    footerColor: footerItem?.fontColor ?? '#4d4d4d',
    footerOffset:
      footerItem?.position?.y != null && isBlank
        ? Math.max(4, Math.round(basePdf.height - footerItem.position.y))
        : defaultFooterOffset,
    footerLine: Boolean(footerLineItem),
  }

  return { config, isBlank }
}

function buildUpdatedStaticSchema(currentBasePdf: any, config: HeaderFooterConfig): any[] {
  const existingList: any[] = Array.isArray(currentBasePdf.staticSchema) ? currentBasePdf.staticSchema : []
  const preservedItems = existingList.filter((item) => !isManagedItem(item?.name))

  const width = currentBasePdf.width || 210
  const height = currentBasePdf.height || 297
  const padding = Array.isArray(currentBasePdf.padding) && currentBasePdf.padding.length === 4
    ? currentBasePdf.padding
    : [20, 20, 20, 20]
  const [top, right, bottom, left] = padding
  const contentWidth = Math.max(10, width - left - right)

  const newItems: any[] = []

  if (config.enableHeader && config.headerText.trim().length > 0) {
    newItems.push({
      name: STATIC_HEADER_TEXT_NAME,
      type: 'text',
      content: config.headerText,
      position: { x: left, y: config.headerOffset },
      width: contentWidth,
      height: 6,
      rotate: 0,
      alignment: config.headerAlignment,
      fontSize: config.headerFontSize,
      fontColor: config.headerColor,
      readOnly: true,
    })

    if (config.headerLine) {
      newItems.push({
        name: STATIC_HEADER_LINE_NAME,
        type: 'line',
        position: { x: left, y: Math.max(config.headerOffset + 6.5, top - 2) },
        width: contentWidth,
        height: 0.2,
        rotate: 0,
        color: '#cccccc',
        opacity: 1,
        readOnly: true,
      })
    }
  }

  if (config.enableFooter) {
    if (config.footerLine) {
      newItems.push({
        name: STATIC_FOOTER_LINE_NAME,
        type: 'line',
        position: { x: left, y: Math.max(10, height - bottom + 2) },
        width: contentWidth,
        height: 0.2,
        rotate: 0,
        color: '#cccccc',
        opacity: 1,
        readOnly: true,
      })
    }

    if (config.footerText.trim().length > 0) {
      newItems.push({
        name: STATIC_FOOTER_TEXT_NAME,
        type: 'text',
        content: config.footerText,
        position: { x: left, y: Math.max(10, height - config.footerOffset) },
        width: contentWidth,
        height: 6,
        rotate: 0,
        alignment: config.footerAlignment,
        fontSize: config.footerFontSize,
        fontColor: config.footerColor,
        readOnly: true,
      })
    }
  }

  return [...preservedItems, ...newItems]
}

export function setupHeaderFooter(ctx: EditorContext) {
  // Botones de alternancia de modo esquema estático
  const toggleBtn = document.getElementById('btn-toggle-static-schema')
  const bannerEndBtn = document.getElementById('btn-end-static-banner')

  toggleBtn?.addEventListener('click', () => {
    toggleStaticSchemaMode(ctx)
  })

  bannerEndBtn?.addEventListener('click', () => {
    if (ctx.state.isEditingStaticSchema) {
      toggleStaticSchemaMode(ctx)
    }
  })

  // Soporte para modal de configuración rápida
  const modal = document.getElementById('header-footer') as HTMLDialogElement | null
  const form = document.getElementById('header-footer-form') as HTMLFormElement | null
  if (!modal || !form) return

  const headerToggle = form.querySelector('#enable-header') as HTMLInputElement | null
  const headerFields = form.querySelector('#header-fields') as HTMLElement | null
  const headerTextInput = form.querySelector('#header-text') as HTMLInputElement | null
  const headerAlignmentName = 'headerAlignment'
  const headerFontSizeSelect = form.querySelector('#header-font-size') as HTMLSelectElement | null
  const headerColorInput = form.querySelector('#header-color') as HTMLInputElement | null
  const headerOffsetInput = form.querySelector('#header-offset') as HTMLInputElement | null
  const headerLineCheckbox = form.querySelector('#header-line') as HTMLInputElement | null

  const footerToggle = form.querySelector('#enable-footer') as HTMLInputElement | null
  const footerFields = form.querySelector('#footer-fields') as HTMLElement | null
  const footerTextInput = form.querySelector('#footer-text') as HTMLInputElement | null
  const footerAlignmentName = 'footerAlignment'

  const readAlignment = (name: string, fallback: 'left' | 'center' | 'right') => {
    const checked = form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
    const value = checked?.value
    if (value === 'left' || value === 'center' || value === 'right') return value
    return fallback
  }

  const setAlignment = (name: string, value: string) => {
    const radio = form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)
    if (radio) radio.checked = true
  }
  const footerFontSizeSelect = form.querySelector('#footer-font-size') as HTMLSelectElement | null
  const footerColorInput = form.querySelector('#footer-color') as HTMLInputElement | null
  const footerOffsetInput = form.querySelector('#footer-offset') as HTMLInputElement | null
  const footerLineCheckbox = form.querySelector('#footer-line') as HTMLInputElement | null

  const nonBlankWarning = form.querySelector('#header-footer-non-blank-warning') as HTMLElement | null
  const formContent = form.querySelector('#header-footer-content') as HTMLElement | null

  const headerFieldsHint = form.querySelector('#header-fields-hint') as HTMLElement | null
  const footerFieldsHint = form.querySelector('#footer-fields-hint') as HTMLElement | null

  const updateSectionVisibility = () => {
    const headerEnabled = Boolean(headerToggle?.checked)
    const footerEnabled = Boolean(footerToggle?.checked)
    headerFields?.classList.toggle('hidden', !headerEnabled)
    headerFieldsHint?.classList.toggle('hidden', headerEnabled)
    footerFields?.classList.toggle('hidden', !footerEnabled)
    footerFieldsHint?.classList.toggle('hidden', footerEnabled)
  }

  headerToggle?.addEventListener('change', updateSectionVisibility)
  footerToggle?.addEventListener('change', updateSectionVisibility)

  const hydrate = () => {
    const designerInstance = ctx.state.designer
    if (!designerInstance) return

    const basePdf = ctx.state.isEditingStaticSchema && ctx.state.savedTemplateBeforeStatic
      ? ctx.state.savedTemplateBeforeStatic.basePdf
      : designerInstance.getTemplate().basePdf

    const { config, isBlank } = extractConfigFromTemplate(basePdf)

    if (!isBlank) {
      nonBlankWarning?.classList.remove('hidden')
      formContent?.classList.add('hidden')
      return
    }

    nonBlankWarning?.classList.add('hidden')
    formContent?.classList.remove('hidden')

    if (headerToggle) headerToggle.checked = config.enableHeader
    if (headerTextInput) headerTextInput.value = config.headerText
    setAlignment(headerAlignmentName, config.headerAlignment)
    if (headerFontSizeSelect) headerFontSizeSelect.value = String(config.headerFontSize)
    if (headerColorInput) headerColorInput.value = config.headerColor
    if (headerOffsetInput) headerOffsetInput.value = String(config.headerOffset)
    if (headerLineCheckbox) headerLineCheckbox.checked = config.headerLine

    if (footerToggle) footerToggle.checked = config.enableFooter
    if (footerTextInput) footerTextInput.value = config.footerText
    setAlignment(footerAlignmentName, config.footerAlignment)
    if (footerFontSizeSelect) footerFontSizeSelect.value = String(config.footerFontSize)
    if (footerColorInput) footerColorInput.value = config.footerColor
    if (footerOffsetInput) footerOffsetInput.value = String(config.footerOffset)
    if (footerLineCheckbox) footerLineCheckbox.checked = config.footerLine

    updateSectionVisibility()
  }

  form.querySelectorAll<HTMLButtonElement>('[data-insert-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.insertTarget
      const textToInsert = btn.dataset.insertText
      if (!targetId || !textToInsert) return

      const input = form.querySelector<HTMLInputElement>(`#${targetId}`)
      if (!input) return

      const start = input.selectionStart ?? input.value.length
      const end = input.selectionEnd ?? input.value.length
      input.value = input.value.slice(0, start) + textToInsert + input.value.slice(end)
      input.focus()
      const newPos = start + textToInsert.length
      input.setSelectionRange(newPos, newPos)
    })
  })

  const readConfigFromForm = (): HeaderFooterConfig => ({
    enableHeader: Boolean(headerToggle?.checked),
    headerText: headerTextInput?.value ?? '',
    headerAlignment: readAlignment(headerAlignmentName, 'left'),
    headerFontSize: Number(headerFontSizeSelect?.value) || 9,
    headerColor: headerColorInput?.value || '#4d4d4d',
    headerOffset: Number(headerOffsetInput?.value) || 10,
    headerLine: Boolean(headerLineCheckbox?.checked),

    enableFooter: Boolean(footerToggle?.checked),
    footerText: footerTextInput?.value ?? '',
    footerAlignment: readAlignment(footerAlignmentName, 'center'),
    footerFontSize: Number(footerFontSizeSelect?.value) || 9,
    footerColor: footerColorInput?.value || '#4d4d4d',
    footerOffset: Number(footerOffsetInput?.value) || 10,
    footerLine: Boolean(footerLineCheckbox?.checked),
  })

  document.querySelectorAll('[data-open-modal="header-footer"]').forEach((trigger) => {
    trigger.addEventListener('click', hydrate)
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const designerInstance = ctx.state.designer
    const paginationManager = ctx.state.pagination
    if (!designerInstance || !paginationManager) return

    const currentBasePdf = ctx.state.isEditingStaticSchema && ctx.state.savedTemplateBeforeStatic
      ? ctx.state.savedTemplateBeforeStatic.basePdf
      : designerInstance.getTemplate().basePdf

    if (!isBlankBasePdf(currentBasePdf)) {
      toast.error('No se pueden añadir esquemas estáticos a un archivo PDF externo')
      return
    }

    const config = readConfigFromForm()
    const finalStaticSchema = buildUpdatedStaticSchema(currentBasePdf, config)

    if (ctx.state.isEditingStaticSchema && ctx.state.savedTemplateBeforeStatic) {
      ctx.state.savedTemplateBeforeStatic.basePdf.staticSchema = finalStaticSchema
      ctx.withSyncing(() => {
        designerInstance.updateTemplate({
          ...designerInstance.getTemplate(),
          schemas: [finalStaticSchema],
        } as any)
      })
    } else {
      const newBasePdf = {
        ...currentBasePdf,
        staticSchema: finalStaticSchema,
      }
      const currentSchemas = designerInstance.getTemplate().schemas
      const newTemplate = paginationManager.updateBasePdf(newBasePdf, currentSchemas)
      ctx.withSyncing(() => {
        designerInstance.updateTemplate(newTemplate as any)
      })
    }

    ctx.markDirty()
    ctx.state.updatePaginationUI()
    toast.success('Configuración de encabezado y pie actualizada')
    modal.close()
  })
}
