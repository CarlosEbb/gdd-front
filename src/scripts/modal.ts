let modalSystemInitialized = false

function initModalSystem() {
  if (!modalSystemInitialized) {
    modalSystemInitialized = true

    // Delegación de eventos para abrir modales - funciona para cualquier botón con data-open-modal
    document.addEventListener('click', (event) => {
      const trigger = (event.target as HTMLElement).closest('[data-open-modal]') as HTMLElement | null

      if (trigger) {
        const modalId = trigger.dataset.openModal as string
        const modal = document.getElementById(modalId) as HTMLDialogElement | null

        if (modal && modal.tagName === 'DIALOG') {
          modal.showModal()
        } else {
          console.warn(`Modal con ID "${modalId}" no encontrado o no es un <dialog>`)
        }
      }
    })

    // Delegación de eventos para cerrar modales al hacer click en el backdrop
    document.addEventListener('click', (event) => {
      const dialog = event.target as HTMLElement

      if (dialog.tagName === 'DIALOG' && dialog.classList.contains('modal-dialog')) {
        const rect = dialog.getBoundingClientRect()
        const clickedInDialog = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom

        if (!clickedInDialog) {
          ;(dialog as HTMLDialogElement).close()
        }
      }
    })
  }
}

// Inicializar con View Transitions de Astro
document.addEventListener('astro:page-load', initModalSystem)
