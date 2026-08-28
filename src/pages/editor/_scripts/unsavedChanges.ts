import { navigate } from 'astro:transitions/client'
import type { EditorContext } from './types'

type BeforePreparationEvent = Event & {
  from?: URL
  to?: URL
}

function isSameLocation(from?: URL, to?: URL): boolean {
  if (!from || !to) return false
  return from.pathname === to.pathname && from.search === to.search
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0
}

function getInternalNavigationHref(anchor: HTMLAnchorElement): string | null {
  if (anchor.hasAttribute('download')) return null
  if (anchor.target && anchor.target !== '_self') return null

  let url: URL
  try {
    url = new URL(anchor.href, window.location.href)
  } catch {
    return null
  }

  if (url.origin !== window.location.origin) return null
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null
  return url.href
}

let unsavedChangesAbort: AbortController | null = null

export function setupUnsavedChanges(ctx: EditorContext) {
  const modal = document.getElementById('unsaved-changes') as HTMLDialogElement | null
  const confirmButton = document.getElementById('btn-leave-without-saving') as HTMLButtonElement | null
  if (!modal || !confirmButton) return

  unsavedChangesAbort?.abort()
  unsavedChangesAbort = new AbortController()
  const { signal } = unsavedChangesAbort
  let pendingHref: string | null = null
  let skipNativeUnload = false

  const openLeaveModal = (href: string | null) => {
    skipNativeUnload = true
    pendingHref = href
    if (!modal.open) modal.showModal()
  }

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!ctx.state.isDirty || skipNativeUnload || modal.open) return
    event.preventDefault()
    event.returnValue = ''
  }

  const handleDocumentClick = (event: MouseEvent) => {
    if (!ctx.state.isDirty || event.defaultPrevented || isModifiedClick(event)) return

    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest('a[href]')
    if (!(anchor instanceof HTMLAnchorElement)) return

    const href = getInternalNavigationHref(anchor)
    if (!href) return

    event.preventDefault()
    event.stopImmediatePropagation()
    openLeaveModal(href)
  }

  const handleBeforePreparation = (event: Event) => {
    if (!ctx.state.isDirty) return

    const navEvent = event as BeforePreparationEvent
    if (isSameLocation(navEvent.from, navEvent.to)) return

    event.preventDefault()
    openLeaveModal(navEvent.to?.href ?? null)
  }

  const leaveWithoutSaving = () => {
    const href = pendingHref
    pendingHref = null
    skipNativeUnload = true
    ctx.clearDirty()
    modal.close()
    if (href) navigate(href)
  }

  window.addEventListener('beforeunload', handleBeforeUnload, { signal })
  document.addEventListener('click', handleDocumentClick, { capture: true, signal })
  document.addEventListener('astro:before-preparation', handleBeforePreparation, { capture: true, signal })
  confirmButton.addEventListener('click', leaveWithoutSaving, { signal })
  modal.addEventListener(
    'close',
    () => {
      pendingHref = null
      if (ctx.state.isDirty) skipNativeUnload = false
    },
    { signal },
  )
  document.addEventListener(
    'astro:before-swap',
    () => {
      unsavedChangesAbort?.abort()
      unsavedChangesAbort = null
    },
    { once: true, signal },
  )
}
