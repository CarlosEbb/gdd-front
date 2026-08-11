import { callAction, setButtonLoading } from '@/scripts/utils.js'
import { toast } from '@/scripts/toast'
import { actions } from 'astro:actions'
import { navigate } from 'astro:transitions/client'

export function setupDeleteDocument() {
  const formDeleteDocument = document.getElementById('delete-document-form') as HTMLFormElement
  const modalDeleteDocument = document.getElementById('delete-document') as HTMLDialogElement
  if (!formDeleteDocument) return

  formDeleteDocument.addEventListener('submit', async (e: Event) => {
    e.preventDefault()
    const formData = new FormData(formDeleteDocument)

    try {
      setButtonLoading('#btn-delete-document', true)
      const { data, error } = await callAction(actions.documents.deleteDocument(formData))
      if (error) {
        toast.error(error.message)
        setButtonLoading('#btn-delete-document', false)
        return
      }
      toast.success(data.message)
      navigate(data.data.redirect)
    } catch (error) {
      toast.error('Ah ocurrido un error al eliminar la plantilla. Por favor, intente nuevamente.')
    } finally {
      setButtonLoading('#btn-delete-document', false)
      modalDeleteDocument.close()
    }
  })
}
