import { callAction, setButtonLoading, compressJson } from '@/scripts/utils.js'
import { toast } from '@/scripts/toast'
import { actions } from 'astro:actions'
import type { EditorContext } from './types'

function updateUrlWithNewVersion(buildNumber: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('build_number', buildNumber)
  window.history.replaceState({}, '', url.toString())
}

export function setupSaveDocument(ctx: EditorContext) {
  const documentationLink = document.getElementById('documentationLink') as HTMLAnchorElement
  const modalNewVersionDocument = document.getElementById('new-version-document') as HTMLDialogElement
  const saveDocumentButton = document.getElementById('btn-save-document') as HTMLButtonElement

  const handleSave = async (uuidTemplate: string, nameVersion: string, btnId: string) => {
    try {
      setButtonLoading(btnId, true)

      const { template: templateData } = ctx.getOutputTemplate()

      const compressedBlob = await compressJson(templateData)
      const formData = new FormData()
      formData.append('uuid_template', uuidTemplate)
      formData.append('template_data', compressedBlob, 'template.json.gz')
      if (nameVersion) {
        formData.append('name_version', nameVersion)
      }

      const { data, error } = await callAction(actions.documents.createNewVersion(formData))
      if (error) {
        toast.error(error.message)
        setButtonLoading(btnId, false)
        return
      }

      nameVersion && modalNewVersionDocument.close()
      ctx.syncEditorWithOutputTemplate(templateData)
      toast.success(data.message)

      const newVersion = data.data.lastVersion?.buildNumber
      documentationLink.href = `/config/documentation/${uuidTemplate}?build_number=${newVersion}`
      updateUrlWithNewVersion(newVersion)
    } catch (error) {
      toast.error('Ah ocurrido un error al guardar la plantilla. Por favor, intente nuevamente.')
    } finally {
      setButtonLoading(btnId, false)
    }
  }

  const handleNewVersion = (e: Event) => {
    const detail = (e as CustomEvent).detail as { uuidTemplate: string; nameVersion: string; btnId: string }
    handleSave(detail.uuidTemplate, detail.nameVersion, detail.btnId)
  }

  const handleSaveNewDocument = async () => {
    const uuidTemplate = saveDocumentButton.dataset.uuidTemplate as string
    await handleSave(uuidTemplate, '', '#btn-save-document')
  }

  document.addEventListener('create-version:submit', handleNewVersion)
  saveDocumentButton.addEventListener('click', handleSaveNewDocument)
}
