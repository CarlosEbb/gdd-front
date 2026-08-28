import { toast } from '@/scripts/toast'
import type { EditorContext } from './types'

export function setupPagination(ctx: EditorContext) {
  const { state, domContainer, withSyncing, markDirty } = ctx

  const paginationBar = document.getElementById('pagination-bar') as HTMLElement
  const paginationPrev = document.getElementById('pagination-prev') as HTMLButtonElement
  const paginationNext = document.getElementById('pagination-next') as HTMLButtonElement
  const paginationPageInput = document.getElementById('pagination-page-input') as HTMLInputElement
  const paginationTotal = document.getElementById('pagination-total') as HTMLSpanElement
  const paginationChunkWrapper = document.getElementById('pagination-chunk-size-wrapper') as HTMLDivElement
  const paginationChunkToggleLabel = paginationChunkWrapper?.querySelector('[data-dropdown-toggle] span.truncate') as HTMLSpanElement | null
  const paginationChunkOptions = paginationChunkWrapper?.querySelectorAll<HTMLButtonElement>('[data-chunk-size]')
  const paginationDeletePage = document.getElementById('pagination-delete-page') as HTMLButtonElement
  const paginationCreatePage = document.getElementById('pagination-create-page') as HTMLButtonElement

  let isAutoNavigatingWheel = false
  let accumulatedWheelDelta = 0
  let wheelResetTimeout: number | null = null

  function setChunkLabel(size: number) {
    if (paginationChunkToggleLabel) {
      paginationChunkToggleLabel.textContent = `Páginas visibles: ${size}`
    }
  }

  function setDeletePageButtonVisibility(visible: boolean) {
    paginationDeletePage.hidden = !visible
  }

  function resetWheelAccumulation() {
    accumulatedWheelDelta = 0
    if (wheelResetTimeout !== null) {
      window.clearTimeout(wheelResetTimeout)
      wheelResetTimeout = null
    }
  }

  function updatePaginationUI() {
    const paginationManager = state.pagination
    if (!paginationManager || paginationManager.totalPages <= 1) {
      paginationBar.classList.add('hidden')
      paginationBar.classList.remove('flex')
      setDeletePageButtonVisibility(false)
      return
    }
    paginationBar.classList.remove('hidden')
    paginationBar.classList.add('flex')
    const { start } = paginationManager.currentRange
    const total = paginationManager.totalPages
    paginationTotal.textContent = String(total)
    paginationPageInput.max = String(total)
    if (document.activeElement !== paginationPageInput) {
      paginationPageInput.value = String(start)
    }
    paginationPrev.disabled = paginationManager.currentChunkIndex === 0
    paginationNext.disabled = paginationManager.currentChunkIndex >= paginationManager.totalChunks - 1

    const showDelete = paginationManager.chunkSize === 1 && paginationManager.totalPages > 1
    setDeletePageButtonVisibility(showDelete)
  }

  state.updatePaginationUI = updatePaginationUI

  function createNewPage() {
    const { pagination: paginationManager, designer: designerInstance } = state
    if (!paginationManager || !designerInstance) return
    const currentSchemas = designerInstance.getTemplate().schemas
    paginationManager.syncFromDesigner(currentSchemas)

    const afterPage = paginationManager.currentRange.end
    const newTemplate = paginationManager.addPage(afterPage)
    if (!newTemplate) return
    withSyncing(() => {
      designerInstance.updateTemplate(newTemplate as any)
    })
    markDirty()
    updatePaginationUI()
    toast.success('Página creada')
  }

  function deleteCurrentPage() {
    const { pagination: paginationManager, designer: designerInstance } = state
    if (!paginationManager || !designerInstance) return
    if (paginationManager.totalPages <= 1) return
    const currentPage = paginationManager.currentRange.start
    const newTemplate = paginationManager.removePage(currentPage)
    if (!newTemplate) return
    withSyncing(() => {
      designerInstance.updateTemplate(newTemplate as any)
    })
    markDirty()
    updatePaginationUI()
    toast.success('Página eliminada')
  }

  function navigateChunk(direction: 'prev' | 'next') {
    const { pagination: paginationManager, designer: designerInstance } = state
    if (!paginationManager || !designerInstance) return false
    const currentSchemas = designerInstance.getTemplate().schemas
    const newTemplate = direction === 'prev' ? paginationManager.prev(currentSchemas) : paginationManager.next(currentSchemas)
    if (newTemplate) {
      withSyncing(() => {
        designerInstance.updateTemplate(newTemplate as any)
      })
      updatePaginationUI()
      return true
    }
    return false
  }

  function goToPage(pageNumber: number) {
    const { pagination: paginationManager, designer: designerInstance } = state
    if (!paginationManager || !designerInstance) return
    const currentSchemas = designerInstance.getTemplate().schemas
    const newTemplate = paginationManager.goToPage(pageNumber, currentSchemas)
    if (newTemplate) {
      withSyncing(() => {
        designerInstance.updateTemplate(newTemplate as any)
      })
    }
    updatePaginationUI()
  }

  function changeChunkSize(newSize: number) {
    const { pagination: paginationManager, designer: designerInstance } = state
    if (!paginationManager || !designerInstance) return
    const currentSchemas = designerInstance.getTemplate().schemas
    const newTemplate = paginationManager.setChunkSize(newSize, currentSchemas)
    if (newTemplate) {
      withSyncing(() => {
        designerInstance.updateTemplate(newTemplate as any)
      })
    }
    updatePaginationUI()
  }

  function deferTemplateUpdate(template: any, onApplied?: () => void) {
    if (state.pendingTemplateUpdate !== null) {
      window.clearTimeout(state.pendingTemplateUpdate)
    }

    state.pendingTemplateUpdate = window.setTimeout(() => {
      state.pendingTemplateUpdate = null
      window.requestAnimationFrame(() => {
        if (!state.designer) return
        withSyncing(() => {
          state.designer!.updateTemplate(template as any)
        })
        updatePaginationUI()
        onApplied?.()
      })
    }, 80)
  }

  function handleEditorWheel(event: WheelEvent) {
    event.preventDefault()
    const paginationManager = state.pagination
    if (!paginationManager) return
    if (!domContainer.contains(event.target as Node | null)) return
    if (isAutoNavigatingWheel || state.isSyncingTemplate) return
    if (paginationManager.totalPages <= 1) return

    if (event.deltaY === 0) {
      resetWheelAccumulation()
      return
    }

    const isScrollingDown = event.deltaY > 0
    const isScrollingUp = event.deltaY < 0
    const canNavigateNext = paginationManager.currentChunkIndex < paginationManager.totalChunks - 1
    const canNavigatePrev = paginationManager.currentChunkIndex > 0

    if ((isScrollingDown && !canNavigateNext) || (isScrollingUp && !canNavigatePrev)) {
      resetWheelAccumulation()
      return
    }

    if ((accumulatedWheelDelta > 0 && isScrollingUp) || (accumulatedWheelDelta < 0 && isScrollingDown)) {
      resetWheelAccumulation()
    }

    accumulatedWheelDelta += event.deltaY

    if (wheelResetTimeout !== null) {
      window.clearTimeout(wheelResetTimeout)
    }

    wheelResetTimeout = window.setTimeout(() => {
      accumulatedWheelDelta = 0
      wheelResetTimeout = null
    }, 180)

    if (Math.abs(accumulatedWheelDelta) < 180) return

    const direction = accumulatedWheelDelta > 0 ? 'next' : 'prev'
    resetWheelAccumulation()
    isAutoNavigatingWheel = true
    const navigated = navigateChunk(direction)

    if (!navigated) {
      isAutoNavigatingWheel = false
      return
    }

    window.setTimeout(() => {
      isAutoNavigatingWheel = false
    }, 180)
  }

  function bindControls() {
    const paginationManager = state.pagination
    const designerInstance = state.designer
    if (!paginationManager || !designerInstance) return

    domContainer.addEventListener('wheel', handleEditorWheel, { passive: false })

    paginationPrev.addEventListener('click', () => navigateChunk('prev'))
    paginationNext.addEventListener('click', () => navigateChunk('next'))

    paginationPageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const value = parseInt(paginationPageInput.value, 10)
        goToPage(value)
        paginationPageInput.blur()
      } else if (e.key === 'Escape') {
        paginationPageInput.blur()
      }
    })
    paginationPageInput.addEventListener('blur', () => {
      updatePaginationUI()
    })
    paginationPageInput.addEventListener('focus', () => {
      paginationPageInput.select()
    })

    setChunkLabel(paginationManager.chunkSize)
    paginationChunkOptions?.forEach((opt) => {
      opt.addEventListener('click', () => {
        const newSize = parseInt(opt.dataset.chunkSize || '1', 10)
        changeChunkSize(newSize)
        setChunkLabel(newSize)
        const container = opt.closest('[data-dropdown-container]')
        const menu = container?.querySelector('[data-dropdown-menu]')
        menu?.classList.remove('is-open')
        container?.classList.remove('is-open')
      })
    })

    updatePaginationUI()

    paginationDeletePage.addEventListener('click', deleteCurrentPage)
    paginationCreatePage?.addEventListener('click', createNewPage)

    designerInstance.onChangeTemplate((updatedTemplate: any) => {
      if (state.isSyncingTemplate) return
      markDirty()
      if (!state.pagination) return

      const { pagesChanged, overflow } = state.pagination.handleTemplateChange(updatedTemplate.schemas)

      if (overflow && state.designer) {
        const overflowPatchedTemplate = overflow.template as any
        const overflowTemplate = { ...updatedTemplate, ...overflowPatchedTemplate, schemas: overflowPatchedTemplate.schemas }
        deferTemplateUpdate(overflowTemplate)
        return
      }

      if (pagesChanged) {
        updatePaginationUI()
      }
    })
  }

  return { bindControls, updatePaginationUI }
}
