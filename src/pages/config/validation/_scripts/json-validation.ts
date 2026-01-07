import { type ValidationRule, type ValidationRules, getOperatorSymbol, createDefaultRule, updateDebugPanel } from './validation-utils'

// ============================================
// ELEMENTOS DEL DOM
// ============================================
interface JsonValidationElements {
  // Card principal
  validationCard: HTMLElement | null
  emptyCardState: HTMLElement | null
  cardTitle: HTMLElement | null

  // Checkboxes
  requiredCheckbox: HTMLInputElement | null
  typeCheckboxes: NodeListOf<HTMLInputElement>

  // Date format
  dateFormatContainer: HTMLElement | null
  dateFormatLabel: HTMLElement | null
  dateFormatRadios: NodeListOf<HTMLInputElement>
  customDateFormatContainer: HTMLElement | null
  customDateFormatInput: HTMLInputElement | null
  btnConfirmDateFormat: HTMLButtonElement | null

  // Validaciones personalizadas
  validationsContainer: HTMLElement | null
  formValidation: HTMLElement | null
  fieldPreview: HTMLElement | null
  operatorSelect: HTMLSelectElement | null
  valueInput: HTMLInputElement | null

  // Botones
  btnAddValidation: HTMLButtonElement | null
  btnCreateValidation: HTMLButtonElement | null
  btnCancelValidation: HTMLButtonElement | null
  btnDeleteCard: HTMLButtonElement | null

  // Template
  templateValidationItem: HTMLTemplateElement | null

  // Sidebar
  fieldsSidebar: HTMLElement | null
}

function getElements(): JsonValidationElements {
  return {
    validationCard: document.getElementById('validation-card'),
    emptyCardState: document.getElementById('empty-card-state'),
    cardTitle: document.querySelector('[data-card-title]'),
    requiredCheckbox: document.querySelector('[data-required-checkbox]'),
    typeCheckboxes: document.querySelectorAll('[data-type-checkbox]'),
    dateFormatContainer: document.querySelector('[data-date-format-container]'),
    dateFormatLabel: document.querySelector('[data-date-format-label]'),
    dateFormatRadios: document.querySelectorAll('[data-date-format-radio]'),
    customDateFormatContainer: document.querySelector('[data-custom-date-format-container]'),
    customDateFormatInput: document.getElementById('custom-date-format-input') as HTMLInputElement | null,
    btnConfirmDateFormat: document.querySelector('[data-btn-confirm-date-format]'),
    validationsContainer: document.querySelector('[data-validations-container]'),
    formValidation: document.querySelector('[data-form-validation]'),
    fieldPreview: document.querySelector('[data-field-preview]'),
    operatorSelect: document.querySelector('[data-operator-select]'),
    valueInput: document.querySelector('[data-value-input]'),
    btnAddValidation: document.querySelector('[data-btn-add-validation]'),
    btnCreateValidation: document.querySelector('[data-btn-create-validation]'),
    btnCancelValidation: document.querySelector('[data-btn-cancel-validation]'),
    btnDeleteCard: document.querySelector('[data-btn-delete-card]'),
    templateValidationItem: document.getElementById('template-validation-items') as HTMLTemplateElement | null,
    fieldsSidebar: document.getElementById('fields-sidebar'),
  }
}

// ============================================
// ESTADO
// ============================================
let validationRules: ValidationRules = {}
let currentField: string | null = null
let elements: JsonValidationElements

// ============================================
// FUNCIONES DE ACTUALIZACIÓN UI
// ============================================
function updateSidebar(): void {
  if (!elements.fieldsSidebar) return

  const fieldItems = elements.fieldsSidebar.querySelectorAll('[data-field-item]')

  fieldItems.forEach((item) => {
    const fieldName = item.getAttribute('data-field-item')
    if (!fieldName) return

    const rule = validationRules[fieldName]
    const requiredBadge = item.querySelector('[data-required-badge]') as HTMLElement
    const fieldInfo = item.querySelector('[data-field-info]') as HTMLElement
    const typesInfo = item.querySelector('[data-types-info]') as HTMLElement
    const validationsInfo = item.querySelector('[data-validations-info]') as HTMLElement
    const deleteBtn = item.querySelector('[data-btn-delete-field-validation]') as HTMLElement

    if (!rule) {
      requiredBadge?.classList.add('hidden')
      fieldInfo?.classList.add('hidden')
      fieldInfo?.classList.remove('flex')
      deleteBtn?.classList.add('hidden')
      deleteBtn?.classList.remove('flex')
      return
    }

    // Mostrar badge de requerido
    if (rule.required) {
      requiredBadge?.classList.remove('hidden')
    } else {
      requiredBadge?.classList.add('hidden')
    }

    // Mostrar info del campo si tiene configuración
    const hasConfig = rule.required || rule.types.length > 0 || rule.customValidations.length > 0

    if (hasConfig) {
      fieldInfo?.classList.remove('hidden')
      fieldInfo?.classList.add('flex')

      // Mostrar botón de eliminar
      deleteBtn?.classList.remove('hidden')
      deleteBtn?.classList.add('flex')

      // Tipos
      if (typesInfo) {
        typesInfo.textContent = rule.types.length > 0 ? rule.types.join(', ') : '-'
      }

      // Validaciones
      if (validationsInfo) {
        const parts: string[] = []

        if (rule.required) parts.push('required')

        // Mostrar cada validación como "campo operator valor"
        rule.customValidations.forEach((v) => {
          parts.push(`${fieldName} ${getOperatorSymbol(v.operator)} ${v.value}`)
        })

        validationsInfo.textContent = parts.length > 0 ? parts.join(', ') : '-'
      }
    } else {
      fieldInfo?.classList.add('hidden')
      fieldInfo?.classList.remove('flex')
      deleteBtn?.classList.add('hidden')
      deleteBtn?.classList.remove('flex')
    }
  })
}

function updateDateFormatUI(rule: ValidationRule): void {
  const hasDateType = rule.types.includes('Date')

  // Mostrar/ocultar el label del formato de fecha
  if (elements.dateFormatLabel) {
    if (hasDateType && rule.dateFormat) {
      elements.dateFormatLabel.textContent = rule.dateFormat
      elements.dateFormatLabel.classList.remove('hidden')
    } else {
      elements.dateFormatLabel.classList.add('hidden')
    }
  }

  // Actualizar radios de formato
  elements.dateFormatRadios.forEach((radio) => {
    radio.checked = radio.value === rule.dateFormat
  })

  // Mostrar/ocultar input de formato personalizado
  if (elements.customDateFormatContainer) {
    if (rule.dateFormat === 'custom') {
      elements.customDateFormatContainer.classList.remove('hidden')
    } else {
      elements.customDateFormatContainer.classList.add('hidden')
    }
  }
}

function updateCard(field: string): void {
  if (!elements.validationCard || !elements.emptyCardState) return

  currentField = field

  // Inicializar regla si no existe
  if (!validationRules[field]) {
    validationRules[field] = createDefaultRule()
  }

  const rule = validationRules[field]

  // Mostrar card y ocultar estado vacío
  elements.emptyCardState.classList.add('hidden')
  elements.validationCard.classList.remove('hidden')
  elements.validationCard.classList.add('card-validation-enter')
  elements.validationCard.setAttribute('data-card-field', field)

  // Actualizar título
  if (elements.cardTitle) {
    elements.cardTitle.textContent = field
  }

  // Actualizar checkbox de requerido
  if (elements.requiredCheckbox) {
    elements.requiredCheckbox.checked = rule.required
  }

  // Actualizar checkboxes de tipos
  elements.typeCheckboxes.forEach((checkbox) => {
    const type = checkbox.getAttribute('data-type-checkbox')
    if (type) {
      checkbox.checked = rule.types.includes(type)
    }
  })

  // Actualizar formato de fecha
  updateDateFormatUI(rule)

  // Actualizar campo preview en el form de validación
  if (elements.fieldPreview) {
    elements.fieldPreview.textContent = field
  }

  // Renderizar validaciones existentes
  renderValidationItems()

  // Ocultar form de validación
  hideValidationForm()

  updateDebugPanel({ validationRules })
}

// ============================================
// RENDERIZADO DE VALIDACIONES
// ============================================
function renderValidationItems(): void {
  if (!elements.validationsContainer || !elements.templateValidationItem || !currentField) return

  const rule = validationRules[currentField]
  if (!rule) return

  // Limpiar contenedor
  elements.validationsContainer.innerHTML = ''

  // Mostrar/ocultar contenedor
  if (rule.customValidations.length > 0) {
    elements.validationsContainer.classList.remove('hidden')
  } else {
    elements.validationsContainer.classList.add('hidden')
    return
  }

  // Renderizar cada validación
  rule.customValidations.forEach((validation, index) => {
    const clone = elements.templateValidationItem!.content.cloneNode(true) as DocumentFragment
    const item = clone.querySelector('.validation-item') as HTMLElement

    if (item) {
      item.setAttribute('data-validation-index', String(index))

      const labelEl = item.querySelector('[data-label-validation]')
      const valueEl = item.querySelector('[data-value-validation]')
      const messageEl = item.querySelector('[data-message-validation]')

      if (labelEl) labelEl.textContent = getOperatorSymbol(validation.operator)
      if (valueEl) valueEl.textContent = validation.value
      if (messageEl) messageEl.textContent = `${currentField} ${getOperatorSymbol(validation.operator)} ${validation.value}`
    }

    elements.validationsContainer!.appendChild(clone)
  })
}

// ============================================
// MANEJO DEL FORMULARIO DE VALIDACIÓN
// ============================================
function showValidationForm(): void {
  if (elements.formValidation) {
    elements.formValidation.classList.remove('hidden')
  }
}

function hideValidationForm(): void {
  if (elements.formValidation) {
    elements.formValidation.classList.add('hidden')
  }
  resetValidationForm()
}

function resetValidationForm(): void {
  if (elements.operatorSelect) elements.operatorSelect.selectedIndex = 0
  if (elements.valueInput) elements.valueInput.value = ''
}

function addCustomValidation(): void {
  if (!currentField || !elements.operatorSelect || !elements.valueInput) return

  const operator = elements.operatorSelect.value
  const value = elements.valueInput.value

  if (!operator) return

  validationRules[currentField].customValidations.push({
    operator,
    value,
    logicalOperator: 'and',
  })

  renderValidationItems()
  hideValidationForm()
  updateSidebar()
  updateDebugPanel({ validationRules })
}

function removeCustomValidation(index: number): void {
  if (!currentField) return

  validationRules[currentField].customValidations.splice(index, 1)
  renderValidationItems()
  updateSidebar()
  updateDebugPanel({ validationRules })
}

// ============================================
// MANEJO DE SELECCIÓN DE FIELDS
// ============================================
function handleFieldSelection(field: string): void {
  updateCard(field)
  updateSidebar()
  updateDebugPanel({ validationRules })
}

function hideCard(): void {
  if (elements.validationCard && elements.emptyCardState) {
    elements.validationCard.classList.add('hidden')
    elements.emptyCardState.classList.remove('hidden')
    currentField = null
  }
}

function deleteFieldValidation(field: string): void {
  // Eliminar regla
  delete validationRules[field]

  // Si es el campo actual, ocultar la card y deseleccionar el radio
  if (currentField === field) {
    hideCard()
    const radio = document.querySelector(`[data-field-radio="${field}"]`) as HTMLInputElement
    if (radio) radio.checked = false
  }

  updateSidebar()
  updateDebugPanel({ validationRules })
}

function deleteCurrentCard(): void {
  if (!currentField) return
  deleteFieldValidation(currentField)
}

// ============================================
// MANEJO DE CAMBIOS EN REQUIRED Y TYPES
// ============================================
function handleRequiredChange(checked: boolean): void {
  if (!currentField) return
  validationRules[currentField].required = checked
  updateSidebar()
  updateDebugPanel({ validationRules })
}

function handleTypeChange(type: string, checked: boolean): void {
  if (!currentField) return

  const rule = validationRules[currentField]

  if (checked) {
    if (!rule.types.includes(type)) {
      rule.types.push(type)
    }

    // Si es Date, mostrar selector de formato
    if (type === 'Date') {
      showDateFormatSelector()
    }
  } else {
    const index = rule.types.indexOf(type)
    if (index > -1) {
      rule.types.splice(index, 1)
    }

    // Si se quita Date, limpiar formato
    if (type === 'Date') {
      rule.dateFormat = null
      hideDateFormatSelector()
    }
  }

  updateSidebar()
  updateDebugPanel({ validationRules })
}

function showDateFormatSelector(): void {
  if (elements.dateFormatContainer) {
    elements.dateFormatContainer.classList.remove('hidden')
  }
}

function hideDateFormatSelector(): void {
  if (elements.dateFormatContainer) {
    elements.dateFormatContainer.classList.add('hidden')
  }
  if (elements.dateFormatLabel) {
    elements.dateFormatLabel.classList.add('hidden')
  }
}

function handleDateFormatChange(format: string): void {
  if (!currentField) return

  validationRules[currentField].dateFormat = format

  // Actualizar label
  if (elements.dateFormatLabel) {
    elements.dateFormatLabel.textContent = format === 'custom' ? 'Personalizado' : format
    elements.dateFormatLabel.classList.remove('hidden')
  }

  // Mostrar/ocultar input personalizado y dropdown
  if (format === 'custom') {
    // Mostrar input personalizado, mantener dropdown abierto
    if (elements.customDateFormatContainer) {
      elements.customDateFormatContainer.classList.remove('hidden')
    }
  } else {
    // Ocultar input personalizado y cerrar dropdown
    if (elements.customDateFormatContainer) {
      elements.customDateFormatContainer.classList.add('hidden')
    }
    // Ocultar el dropdown después de seleccionar
    hideDateFormatSelector()
  }

  updateDebugPanel({ validationRules })
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners(): void {
  // Selección de fields en el sidebar (radio buttons)
  elements.fieldsSidebar?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (target.matches('[data-field-radio]')) {
      const field = target.getAttribute('data-field-radio')
      if (field) {
        handleFieldSelection(field)
      }
    }
  })

  // Click en botón eliminar validación de campo
  elements.fieldsSidebar?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const deleteBtn = target.closest('[data-btn-delete-field-validation]')
    if (deleteBtn) {
      e.preventDefault()
      e.stopPropagation()
      const field = deleteBtn.getAttribute('data-btn-delete-field-validation')
      if (field) {
        deleteFieldValidation(field)
      }
    }
  })

  // Checkbox de requerido
  elements.requiredCheckbox?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    handleRequiredChange(target.checked)
  })

  // Checkboxes de tipos
  elements.typeCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      const type = target.getAttribute('data-type-checkbox')
      if (type) {
        handleTypeChange(type, target.checked)
      }
    })
  })

  // Radios de formato de fecha
  elements.dateFormatRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      if (target.checked) {
        handleDateFormatChange(target.value)
      }
    })
  })

  // Input de formato personalizado
  elements.customDateFormatInput?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement
    if (currentField) {
      validationRules[currentField].dateFormat = target.value || 'custom'
      if (elements.dateFormatLabel) {
        elements.dateFormatLabel.textContent = target.value || 'Personalizado'
      }
      updateDebugPanel({ validationRules })
    }
  })

  // Cerrar dropdown de fecha al presionar Enter en el input personalizado
  elements.customDateFormatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      hideDateFormatSelector()
    }
  })

  // Botón confirmar formato de fecha personalizado
  elements.btnConfirmDateFormat?.addEventListener('click', () => {
    hideDateFormatSelector()
  })

  // Botón agregar validación
  elements.btnAddValidation?.addEventListener('click', showValidationForm)

  // Botón crear validación
  elements.btnCreateValidation?.addEventListener('click', addCustomValidation)

  // Botón cancelar validación
  elements.btnCancelValidation?.addEventListener('click', hideValidationForm)

  // Botón eliminar card
  elements.btnDeleteCard?.addEventListener('click', deleteCurrentCard)

  // Event delegation para eliminar validaciones
  elements.validationsContainer?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const deleteBtn = target.closest('[data-btn-delete-validation-item]')

    if (deleteBtn) {
      const item = deleteBtn.closest('[data-validation-index]')
      if (item) {
        const index = parseInt(item.getAttribute('data-validation-index') || '0', 10)
        removeCustomValidation(index)
      }
    }
  })
}

// ============================================
// DEBUG PANEL TOGGLE
// ============================================
function setupDebugPanelToggle(): void {
  const toggleDebug = document.getElementById('toggle-debug')
  const debugContent = document.getElementById('debug-content')
  let debugMinimized = false

  toggleDebug?.addEventListener('click', () => {
    debugMinimized = !debugMinimized
    if (debugContent) {
      debugContent.classList.toggle('hidden', debugMinimized)
    }
    if (toggleDebug) {
      toggleDebug.textContent = debugMinimized ? '+' : '−'
    }
  })
}

// ============================================
// INICIALIZACIÓN
// ============================================
export function initValidationSystem(): void {
  // Reset state
  validationRules = {}
  currentField = null

  // Get elements
  elements = getElements()

  // Setup event listeners
  setupEventListeners()
  setupDebugPanelToggle()

  // Initial debug panel update
  updateDebugPanel({ validationRules })
}
