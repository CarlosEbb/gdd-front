import { navigate } from 'astro:transitions/client'

const CARD_SELECTOR = '.document-card, .document-list-item'

let initialized = false

function handleDocumentClick(e: Event) {
  const target = e.target as HTMLElement

  // Si se hace clic en el botón del dropdown
  const dropdownBtn = target.closest<HTMLButtonElement>('[data-btn-dropdown]')
  if (dropdownBtn) {
    e.stopPropagation()
    const card = dropdownBtn.closest<HTMLElement>(CARD_SELECTOR)
    const dropdown = card?.querySelector<HTMLDivElement>('[data-card-dropdown]')

    // Cerrar otros dropdowns abiertos
    document.querySelectorAll('[data-card-dropdown].is-open').forEach((menu) => {
      if (menu !== dropdown) {
        menu.classList.remove('is-open')
      }
    })

    dropdown?.classList.toggle('is-open')
    return
  }

  // Si se hace clic en una acción del dropdown
  const actionBtn = target.closest<HTMLButtonElement>('[data-action]')
  if (actionBtn) {
    e.stopPropagation()
    const card = actionBtn.closest<HTMLElement>(CARD_SELECTOR)
    const action = actionBtn.dataset.action

    if (!card) return

    // Obtener los data attributes del contenedor padre
    const cardData = {
      url: card.dataset.url,
      title: card.dataset.title,
      createdAt: card.dataset.createdAt,
      workspaceId: card.dataset.workspaceId,
      uuid: card.dataset.uuid,
      nameVersion: card.dataset.nameVersion,
      buildNumber: card.dataset.buildNumber,
      uuidVersion: card.dataset.uuidVersion,
    }

    // Cerrar el dropdown
    const dropdown = card.querySelector<HTMLDivElement>('[data-card-dropdown]')
    dropdown?.classList.remove('is-open')

    const eventMap: Record<string, string> = {
      view: 'document:view',
      delete: 'document:delete',
      'view-documentation': 'document:view-documentation',
      generated: 'document:generated',
      duplicate: 'document:duplicate',
    }

    const eventName = action ? eventMap[action] : undefined
    if (eventName) {
      const customEvent = new CustomEvent(eventName, {
        detail: cardData,
        bubbles: true,
      })
      card.dispatchEvent(customEvent)
    }
    return
  }

  // Cerrar dropdowns al hacer clic fuera
  document.querySelectorAll('[data-card-dropdown].is-open').forEach((menu) => {
    menu.classList.remove('is-open')
  })

  // Si se hace clic en la card (pero no en el dropdown o sus botones)
  const card = target.closest<HTMLElement>(CARD_SELECTOR)
  if (card && !target.closest('[data-card-dropdown]') && !target.closest('[data-btn-dropdown]')) {
    const url = card.dataset.url as string
    if (url) navigate(url)
  }
}

export function initDocumentCardActions() {
  if (initialized) return
  initialized = true
  document.addEventListener('click', handleDocumentClick)
}
