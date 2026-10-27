import { actions } from 'astro:actions'
import { navigate } from 'astro:transitions/client'
import { callAction, setButtonLoading } from '@/scripts/utils'
import { toast } from '@/scripts/toast'
import { formatDocumentFileSize, validateDocumentFile } from '@/lib/document-upload'

const MODAL_ID = 'save-template'
const FORM_ID = 'save-template-form'
const TABS_CONTAINER_ID = 'create-document-tabs'
const SUBMIT_BUTTON_ID = 'btn-save-template'
const FILE_DROPZONE_ID = 'create-document-file'

type CreateTab = 'blank' | 'from-file'

const SUBMIT_COPY: Record<CreateTab, { label: string; loadingText: string }> = {
  blank: { label: 'Crear documento', loadingText: 'Creando documento...' },
  'from-file': { label: 'Crear desde archivo', loadingText: 'Procesando documento...' },
}

function slugifyDocumentName(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function getActiveTab(container: Element | null): CreateTab {
  const value = container?.getAttribute('data-tabs-value')
  return value === 'from-file' ? 'from-file' : 'blank'
}

function updateSubmitButtonForTab(tab: CreateTab) {
  const button = document.getElementById(SUBMIT_BUTTON_ID) as HTMLButtonElement | null
  if (!button || button.hasAttribute('data-loading')) return

  const copy = SUBMIT_COPY[tab]
  button.setAttribute('data-loading-text', copy.loadingText)

  const content = button.querySelector('[data-button-content]')
  if (!content) return

  const labelNode = Array.from(content.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
  if (labelNode) {
    labelNode.textContent = copy.label
  }

  button.setAttribute('data-original-content', content.innerHTML)
}

function syncTabFieldState(tabsContainer: Element | null) {
  const activeTab = getActiveTab(tabsContainer)
  updateSubmitButtonForTab(activeTab)

  const fields = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    '[data-create-tab-field]',
  )

  fields.forEach((field) => {
    const fieldTab = field.getAttribute('data-create-tab-field') as CreateTab | null
    if (!fieldTab) return
    field.disabled = fieldTab !== activeTab
  })
}

function navigateToEditor(data: { template: { uuid: string; uuidWorkspace: string; title: string }; lastVersion?: { buildNumber: string } }) {
  const editorUrl = new URL(`/editor/${data.template.uuid}`, window.location.origin)
  editorUrl.searchParams.set('build_number', String(data.lastVersion?.buildNumber))
  editorUrl.searchParams.set('id_workspace', data.template.uuidWorkspace)
  editorUrl.searchParams.set('name_document', data.template.title)
  navigate(editorUrl.pathname + editorUrl.search)
}

function wireFileDropzone(onFileChange: (file: File | undefined) => void) {
  const dropZone = document.getElementById(`${FILE_DROPZONE_ID}-drop-zone`)
  const fileInput = document.getElementById(`${FILE_DROPZONE_ID}-input`) as HTMLInputElement | null
  const stateDefault = document.getElementById(`${FILE_DROPZONE_ID}-state-default`)
  const stateSuccess = document.getElementById(`${FILE_DROPZONE_ID}-state-success`)
  const fileNameDisplay = document.getElementById(`${FILE_DROPZONE_ID}-file-name-display`)
  const successFileName = document.getElementById(`${FILE_DROPZONE_ID}-success-file-name`)
  const successFileSize = document.getElementById(`${FILE_DROPZONE_ID}-success-file-size`)
  const errorEl = document.getElementById(`${FILE_DROPZONE_ID}-error`)
  const changeBtn = document.getElementById(`${FILE_DROPZONE_ID}-btn-change-file`) as HTMLButtonElement | null

  if (!dropZone || !fileInput) return

  const setDropzoneError = (message: string) => {
    if (!errorEl) return
    errorEl.textContent = message
    errorEl.classList.toggle('hidden', message.length === 0)
  }

  const setDropzonePanel = (element: Element | null, visible: boolean) => {
    element?.classList.toggle('hidden', !visible)
    element?.classList.toggle('flex', visible)
  }

  const setUiForFile = (file: File | undefined) => {
    const hasFile = Boolean(file)
    if (!hasFile) fileInput.value = ''

    if (fileNameDisplay) {
      fileNameDisplay.textContent = file?.name ?? 'Ningún archivo seleccionado'
      fileNameDisplay.classList.toggle('text-primary', hasFile)
      fileNameDisplay.classList.toggle('font-medium', hasFile)
    }

    if (file) {
      if (successFileName) successFileName.textContent = file.name
      if (successFileSize) successFileSize.textContent = formatDocumentFileSize(file.size)
    }

    setDropzonePanel(stateDefault, !hasFile)
    setDropzonePanel(stateSuccess, hasFile)
  }

  const handleFile = async (file: File | undefined) => {
    setDropzoneError('')
    if (!file) {
      setUiForFile(undefined)
      onFileChange(undefined)
      return
    }

    const validation = await validateDocumentFile(file)
    if (!validation.valid) {
      setDropzoneError(validation.message)
      setUiForFile(undefined)
      onFileChange(undefined)
      return
    }

    if (fileInput.files?.length === 0) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInput.files = dataTransfer.files
    }

    setUiForFile(file)
    onFileChange(file)
  }

  fileInput.addEventListener('change', () => {
    void handleFile(fileInput.files?.[0])
  })

  changeBtn?.addEventListener('click', (event) => {
    event.preventDefault()
    fileInput.click()
  })

  const preventDefaults = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults)
  })
  const setDropzoneActive = (active: boolean) => {
    dropZone.classList.toggle('bg-primary/5', active)
    dropZone.classList.toggle('border-primary', active)
  }

  ;['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => setDropzoneActive(true))
  })
  ;['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => setDropzoneActive(false))
  })

  dropZone.addEventListener('drop', (event: DragEvent) => {
    void handleFile(event.dataTransfer?.files?.[0])
  })
}

export function initializeCreateDocumentModal() {
  const modal = document.getElementById(MODAL_ID) as HTMLDialogElement | null
  const form = document.getElementById(FORM_ID) as HTMLFormElement | null
  const tabsContainer = document.getElementById(TABS_CONTAINER_ID)

  if (!form || !modal) return
  if (form.dataset.createDocumentModalInit === 'true') return
  form.dataset.createDocumentModalInit = 'true'

  const btnGenerateWithIA = document.getElementById('generate_with_ai') as HTMLInputElement
  const generateWithAIToggle = document.getElementById('generate-with-ai-toggle') as HTMLButtonElement
  const generateWithAIIcon = document.getElementById('generate-with-ai-icon') as HTMLElement
  const promptContainer = document.getElementById('prompt-container') as HTMLDivElement
  const pageSettingsToggle = document.getElementById('page-settings-toggle') as HTMLButtonElement
  const pageSettingsContent = document.getElementById('page-settings-content') as HTMLDivElement
  const pageSettingsIcon = document.getElementById('page-settings-icon') as HTMLElement

  let selectedFile: File | undefined

  wireFileDropzone((file) => {
    selectedFile = file
  })

  syncTabFieldState(tabsContainer)

  tabsContainer?.addEventListener('click', (event) => {
    const trigger = (event.target as Element).closest('[data-tabs-trigger]')
    if (!trigger || !tabsContainer.contains(trigger)) return
    window.requestAnimationFrame(() => syncTabFieldState(tabsContainer))
  })

  pageSettingsToggle?.addEventListener('click', () => {
    const isOpen = pageSettingsContent.classList.toggle('grid-rows-[1fr]')
    pageSettingsContent.classList.toggle('grid-rows-[0fr]', !isOpen)
    pageSettingsIcon.classList.toggle('rotate-180')
  })

  const handleGenerateWithIA = () => {
    btnGenerateWithIA.checked = !btnGenerateWithIA.checked
    const promptTextarea = form.querySelector('textarea[name="prompt"]') as HTMLTextAreaElement
    const isOpen = promptContainer.classList.toggle('grid-rows-[1fr]')
    promptContainer.classList.toggle('grid-rows-[0fr]', !isOpen)
    generateWithAIIcon.classList.toggle('rotate-180')
    const promptInner = document.getElementById('prompt-inner') as HTMLDivElement
    promptInner.classList.toggle('p-4', isOpen)
    promptInner.classList.toggle('p-0', !isOpen)

    const action = btnGenerateWithIA.checked ? 'setAttribute' : 'removeAttribute'
    promptTextarea[action]('name', 'prompt')
  }

  generateWithAIToggle?.addEventListener('click', handleGenerateWithIA)

  const checkAndLoadWorkspaces = async () => {
    const selectWorkspace = document.getElementById('select-workspace') as HTMLSelectElement | null
    const warningText = document.getElementById('no-workspaces-warning') as HTMLParagraphElement | null

    if (!selectWorkspace) return

    const optionsCount = Array.from(selectWorkspace.options).filter((opt) => opt.value !== '').length
    if (optionsCount > 0) return

    const placeholderOption = selectWorkspace.querySelector('option[value=""]') as HTMLOptionElement | null
    const originalPlaceholder = placeholderOption?.textContent || 'Seleccione un espacio de trabajo'

    try {
      if (placeholderOption) {
        placeholderOption.textContent = 'Cargando espacios de trabajo...'
      }

      const { data, error } = await callAction(actions.workspaces.list())

      if (error || !data || !Array.isArray(data.data)) {
        if (placeholderOption) placeholderOption.textContent = 'Error al cargar espacios de trabajo'
        return
      }

      selectWorkspace.innerHTML = ''
      const newPlaceholder = document.createElement('option')
      newPlaceholder.value = ''
      newPlaceholder.disabled = true
      newPlaceholder.selected = true
      newPlaceholder.textContent = originalPlaceholder
      selectWorkspace.add(newPlaceholder)

      const workspacesList = data.data
      if (workspacesList.length === 0) {
        selectWorkspace.disabled = true
        warningText?.classList.toggle('hidden', false)
        return
      }

      workspacesList.forEach((workspace: { uuid: string; name: string }) => {
        const opt = document.createElement('option')
        opt.value = workspace.uuid
        opt.textContent = workspace.name
        selectWorkspace.add(opt)
      })

      selectWorkspace.disabled = false
      warningText?.classList.toggle('hidden', true)
    } catch (error) {
      console.error('Error al cargar espacios de trabajo:', error)
      if (placeholderOption) placeholderOption.textContent = 'Error al cargar espacios de trabajo'
    }
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
        if (modal.hasAttribute('open')) {
          checkAndLoadWorkspaces()
          syncTabFieldState(tabsContainer)
        }
      }
    })
  })

  observer.observe(modal, { attributes: true })

  const handleSubmit = async (event: Event) => {
    event.preventDefault()

    const activeTab = getActiveTab(tabsContainer)
    const copy = SUBMIT_COPY[activeTab]

    if (!form.reportValidity()) return

    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const name = slugifyDocumentName(title)
    formData.set('name', name)

    if (activeTab === 'from-file') {
      const fileInput = document.getElementById(`${FILE_DROPZONE_ID}-input`) as HTMLInputElement | null
      const file = selectedFile ?? fileInput?.files?.[0]
      const validation = await validateDocumentFile(file)
      if (!validation.valid) {
        const errorEl = document.getElementById(`${FILE_DROPZONE_ID}-error`)
        if (errorEl) {
          errorEl.textContent = validation.message
          errorEl.classList.toggle('hidden', false)
        } else {
          toast.error(validation.message)
        }
        return
      }
    }

    try {
      setButtonLoading(`#${SUBMIT_BUTTON_ID}`, true, { loadingText: copy.loadingText })

      if (activeTab === 'from-file') {
        const fileInput = document.getElementById(`${FILE_DROPZONE_ID}-input`) as HTMLInputElement | null
        const file = selectedFile ?? fileInput?.files?.[0]

        const uploadData = new FormData()
        uploadData.append('title', title)
        uploadData.append('name', name)
        uploadData.append('uuid_workspace', formData.get('uuid_workspace') as string)
        const description = (formData.get('description') as string)?.trim()
        if (description) uploadData.append('description', description)
        uploadData.append('document', file!)

        const { data, error } = await callAction(actions.documents.createTemplateFromDocument(uploadData))

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success(data.message)
        navigateToEditor(data.data)
        modal.close()
        return
      }

      const { data, error } = await callAction(actions.documents.createTemplate(formData))

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(data.message)
      navigateToEditor(data.data)
      modal.close()
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Error al crear el documento')
      }
    } finally {
      setButtonLoading(`#${SUBMIT_BUTTON_ID}`, false)
    }
  }

  form.addEventListener('submit', handleSubmit)
}
