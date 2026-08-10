import toast from '@/scripts/toast'
import { base64ToBlob, callAction, setButtonLoading } from '@/scripts/utils'
import { actions } from 'astro:actions'
import { navigate } from 'astro:transitions/client'

// Funciones helper para obtener elementos dinámicamente
const getModalDetails = () => document.getElementById('modal-details') as HTMLDialogElement | null
const getModalDelete = () => document.getElementById('modal-delete') as HTMLDialogElement | null

let listenersAttached = false

export function initDocumentModals() {
  if (listenersAttached) return
  listenersAttached = true

  document.addEventListener('document:details', (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const modal = getModalDetails()
    if (modal) modal.showModal()
  })

  document.addEventListener('document:delete', (event: Event) => {
    const cardData = (event as CustomEvent).detail

    const documentName = document.getElementById('document-name') as HTMLParagraphElement | null
    const uuidTemplate = document.getElementById('uuid-template') as HTMLInputElement | null
    const nameVersion = document.getElementById('name-version') as HTMLInputElement | null

    if (documentName) documentName.textContent = cardData.title
    if (uuidTemplate) uuidTemplate.value = cardData.uuid
    if (nameVersion) nameVersion.value = cardData.nameVersion

    const modal = getModalDelete()
    if (modal) modal.showModal()
  })

  document.addEventListener('document:view', async (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const { uuid, buildNumber } = cardData
    const { data, error } = await callAction(actions.documents.generatePDF({ uuid_template: uuid, build_number: buildNumber as string }))

    if (error) {
      toast.error(error.message)
      return
    }

    if (data && 'base64' in data && data.type === 'pdf') {
      const blob = base64ToBlob(data.base64)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast.success('Documento generado exitosamente')
    } else {
      toast.error('Error al generar el documento')
    }
  })

  document.addEventListener('document:template', async (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const { title, uuidVersion } = cardData

    const { data, error } = await callAction(
      actions.templates.create({
        uuidDocument: uuidVersion,
        title: title || 'Plantilla creada desde documento',
      })
    )

    if (error) {
      toast.error(error.message)
      return
    }

    navigate('/templates')
    toast.success('Plantilla creada exitosamente')
  })

  document.addEventListener('document:generated', async (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const { uuid, buildNumber } = cardData
    navigate(`/config/generated/${uuid}?build_number=${buildNumber}`)
  })

  document.addEventListener('document:view-documentation', async (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const { uuid, buildNumber } = cardData
    navigate(`/config/documentation/${uuid}?build_number=${buildNumber}`)
  })

  document.addEventListener('submit', async (event: Event) => {
    const form = event.target as HTMLFormElement
    if (form.id === 'delete-document-form') {
      event.preventDefault()
      const dataForm = new FormData(form)

      try {
        setButtonLoading('#btn-delete-document', true)
        const { data, error } = await callAction(actions.documents.deleteDocument(dataForm))

        if (error) {
          toast.error(error.message)
          setButtonLoading('#btn-delete-document', false)
          return
        }

        const modal = getModalDelete()
        if (modal) modal.close()

        toast.success(data.message)
        const uuid = dataForm.get('uuid_template') as string
        const card = document.querySelector(`[data-uuid="${uuid}"]`)
        card?.remove()
      } catch (error) {
        toast.error('Ha ocurrido un error al eliminar el documento. Por favor, intente nuevamente.')
      } finally {
        setButtonLoading('#btn-delete-document', false)
      }
    } else if (form.id === 'edit-document-metadata-form') {
      event.preventDefault()
      const dataForm = new FormData(form)

      const uuid_version = dataForm.get('uuid') as string
      const title = dataForm.get('titulo') as string
      const name = dataForm.get('name') as string
      const description = dataForm.get('descripcion') as string

      try {
        setButtonLoading('#btn-edit-document-metadata', true)
        const { data, error } = await callAction(
          actions.documents.updateMetadata({
            uuid_version,
            title,
            name: name || undefined,
            description: description || undefined,
          })
        )

        if (error) {
          toast.error(error.message)
          setButtonLoading('#btn-edit-document-metadata', false)
          return
        }

        const modal = document.getElementById('edit-document-metadata') as HTMLDialogElement | null
        if (modal) modal.close()

        toast.success(data?.message || 'Metadata del documento actualizada exitosamente')
        navigate(window.location.pathname + window.location.search)
      } catch (error) {
        toast.error('Ha ocurrido un error al actualizar la metadata. Por favor, intente nuevamente.')
      } finally {
        setButtonLoading('#btn-edit-document-metadata', false)
      }
    }
  })

  document.addEventListener('document:edit-metadata', (event: Event) => {
    const cardData = (event as CustomEvent).detail
    const modal = document.getElementById('edit-document-metadata') as HTMLDialogElement | null
    if (!modal) return

    const form = document.getElementById('edit-document-metadata-form') as HTMLFormElement | null
    if (!form) return

    const uuidInput = form.querySelector<HTMLInputElement>('[name="uuid"]')
    const tituloInput = form.querySelector<HTMLInputElement>('[name="titulo"]')
    const nameInput = form.querySelector<HTMLInputElement>('[name="name"]')
    const descripcionInput = form.querySelector<HTMLInputElement>('[name="descripcion"]')

    if (uuidInput) uuidInput.value = cardData.uuidVersion || ''
    if (tituloInput) tituloInput.value = cardData.title || ''
    if (nameInput) nameInput.value = cardData.nameVersion || ''
    if (descripcionInput) descripcionInput.value = cardData.description || ''

    modal.showModal()
  })
}
