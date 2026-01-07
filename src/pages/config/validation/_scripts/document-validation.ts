import { type HiddenCondition, type DocumentValidationState, getOperatorSymbol, updateDebugPanel } from './validation-utils'

// ============================================
// ESTADO
// ============================================
const state: DocumentValidationState = {
  hiddenConditions: [],
  selectedFieldsToHide: [],
}

// ============================================
// ELEMENTOS DEL DOM
// ============================================
interface DocumentValidationElements {
  // Paso 1
  fieldCheckboxes: NodeListOf<HTMLInputElement>
  btnCreateValidation: HTMLButtonElement | null

  // Paso 2
  emptyStatePaso2: HTMLElement | null
  formContainer: HTMLElement | null
  logicalOperators: HTMLElement | null
  selectedFieldsDisplay: HTMLElement | null
  operatorSelect: HTMLSelectElement | null
  valueInput: HTMLInputElement | null
  logicalOperatorRadios: NodeListOf<HTMLInputElement>
  btnAddCondition: HTMLButtonElement | null

  // Paso 3
  emptyStatePaso3: HTMLElement | null
  conditionsContainer: HTMLElement | null

  // Templates
  templateCondition: HTMLTemplateElement | null
}

function getElements(): DocumentValidationElements {
  return {
    // Paso 1
    fieldCheckboxes: document.querySelectorAll('[data-field-hide-checkbox]'),
    btnCreateValidation: document.getElementById('btn-create-validation') as HTMLButtonElement | null,

    // Paso 2
    emptyStatePaso2: document.querySelector('[data-empty-state-paso2]'),
    formContainer: document.querySelector('[data-form-container]'),
    logicalOperators: document.querySelector('[data-logical-operators]'),
    selectedFieldsDisplay: document.querySelector('[data-selected-fields-display]'),
    operatorSelect: document.querySelector('[data-form-container] select[name="operator"]'),
    valueInput: document.querySelector('[data-form-container] input[name="value"]'),
    logicalOperatorRadios: document.querySelectorAll('[data-logical-operator-radio]'),
    btnAddCondition: document.querySelector('[data-btn-add-condition]'),

    // Paso 3
    emptyStatePaso3: document.querySelector('[data-empty-state-paso3]'),
    conditionsContainer: document.querySelector('[data-conditions-container]'),

    // Templates
    templateCondition: document.getElementById('template-condition-item') as HTMLTemplateElement | null,
  }
}

// ============================================
// GESTIÓN DEL ESTADO
// ============================================
function updateSelectedFields(): void {
  const elements = getElements()
  state.selectedFieldsToHide = Array.from(elements.fieldCheckboxes)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value)
}

function uncheckAllFieldCheckboxes(): void {
  const elements = getElements()
  elements.fieldCheckboxes.forEach((checkbox) => {
    checkbox.checked = false
  })
}

function clearSelectedFields(): void {
  state.selectedFieldsToHide = []
}

function addHiddenCondition(condition: HiddenCondition): void {
  state.hiddenConditions.push(condition)
  updateUI()
  updateDebugPanel({ hiddenConditions: state.hiddenConditions })
}

function removeHiddenCondition(index: number): void {
  state.hiddenConditions.splice(index, 1)
  updateUI()
  updateDebugPanel({ hiddenConditions: state.hiddenConditions })
}

// ============================================
// ACTUALIZACIÓN DE LA UI
// ============================================
function updateUI(): void {
  updatePaso2()
  updatePaso3()
}

function updatePaso2(): void {
  // Si no hay campos seleccionados, mostrar empty state
  if (state.selectedFieldsToHide.length === 0) {
    showEmptyStatePaso2()
    return
  }

  // Mostrar formulario
  hideEmptyStatePaso2()
  showForm()

  // Mostrar/ocultar operadores lógicos
  if (state.hiddenConditions.length === 0) {
    hideLogicalOperators()
  } else {
    showLogicalOperators()
  }

  // Actualizar display de campos seleccionados
  updateSelectedFieldsDisplay()
}

function updatePaso3(): void {
  if (state.hiddenConditions.length === 0) {
    showEmptyStatePaso3()
    hideConditionsContainer()
  } else {
    hideEmptyStatePaso3()
    showConditionsContainer()
    renderConditions()
  }
}

function showEmptyStatePaso2(): void {
  const elements = getElements()
  if (elements.emptyStatePaso2) {
    elements.emptyStatePaso2.classList.remove('hidden')
  }
  hideForm()
}

function hideEmptyStatePaso2(): void {
  const elements = getElements()
  if (elements.emptyStatePaso2) {
    elements.emptyStatePaso2.classList.add('hidden')
  }
}

function showForm(): void {
  const elements = getElements()
  if (elements.formContainer) {
    elements.formContainer.classList.remove('hidden')
  }
}

function hideForm(): void {
  const elements = getElements()
  if (elements.formContainer) {
    elements.formContainer.classList.add('hidden')
  }
}

function showLogicalOperators(): void {
  const elements = getElements()
  if (elements.logicalOperators) {
    elements.logicalOperators.classList.remove('hidden')
  }
}

function hideLogicalOperators(): void {
  const elements = getElements()
  if (elements.logicalOperators) {
    elements.logicalOperators.classList.add('hidden')
  }
}

function showEmptyStatePaso3(): void {
  const elements = getElements()
  if (elements.emptyStatePaso3) {
    elements.emptyStatePaso3.classList.remove('hidden')
  }
}

function hideEmptyStatePaso3(): void {
  const elements = getElements()
  if (elements.emptyStatePaso3) {
    elements.emptyStatePaso3.classList.add('hidden')
  }
}

function showConditionsContainer(): void {
  const elements = getElements()
  if (elements.conditionsContainer) {
    elements.conditionsContainer.classList.remove('hidden')
  }
}

function hideConditionsContainer(): void {
  const elements = getElements()
  if (elements.conditionsContainer) {
    elements.conditionsContainer.classList.add('hidden')
  }
}

function updateSelectedFieldsDisplay(): void {
  const elements = getElements()
  if (!elements.selectedFieldsDisplay) return

  // Limpiar contenedor
  elements.selectedFieldsDisplay.innerHTML = ''

  if (state.selectedFieldsToHide.length === 0) {
    const emptySpan = document.createElement('span')
    emptySpan.className = 'text-sm text-gray-500'
    emptySpan.textContent = 'No hay campos seleccionados'
    elements.selectedFieldsDisplay.appendChild(emptySpan)
    return
  }

  // Agregar badges de campos seleccionados
  state.selectedFieldsToHide.forEach((field) => {
    const badge = document.createElement('span')
    badge.className = 'rounded-lg bg-custom-blue3/20 px-3 py-1.5 text-sm font-medium text-gray-700'
    badge.textContent = field
    elements?.selectedFieldsDisplay?.appendChild(badge)
  })
}

function renderConditions(): void {
  const elements = getElements()
  if (!elements.conditionsContainer || !elements.templateCondition) return

  elements.conditionsContainer.innerHTML = ''

  state.hiddenConditions.forEach((condition, index) => {
    const conditionItem = createConditionItem(condition, index)
    elements.conditionsContainer!.appendChild(conditionItem)
  })
}

function createConditionItem(condition: HiddenCondition, index: number): HTMLElement {
  const elements = getElements()
  if (!elements.templateCondition) {
    console.error('Template not found')
    return document.createElement('li')
  }

  const clone = elements.templateCondition.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector('li') as HTMLElement

  if (!li) return document.createElement('li')

  // Establecer el índice
  li.setAttribute('data-condition-index', String(index))

  // Llenar los datos
  const fieldText = li.querySelector('[data-field-text]')
  const operatorText = li.querySelector('[data-operator-text]')
  const valueText = li.querySelector('[data-value-text]')
  const messageText = li.querySelector('[data-message-text]')
  const deleteBtn = li.querySelector('[data-btn-delete-condition]')

  if (fieldText) fieldText.textContent = condition.field
  if (operatorText) operatorText.textContent = getOperatorSymbol(condition.operator)
  if (valueText) valueText.textContent = condition.value
  if (messageText) messageText.textContent = `${condition.field} ${getOperatorSymbol(condition.operator)} ${condition.value}`
  if (deleteBtn) deleteBtn.setAttribute('data-btn-delete-condition', String(index))

  return li
}

function resetForm(): void {
  const elements = getElements()

  if (elements.operatorSelect) elements.operatorSelect.selectedIndex = 0
  if (elements.valueInput) elements.valueInput.value = ''

  // Reset radio buttons
  elements.logicalOperatorRadios.forEach((radio) => {
    radio.checked = false
  })

  // Seleccionar 'and' por defecto si hay condiciones
  if (state.hiddenConditions.length > 0) {
    const andRadio = document.querySelector('[data-logical-operator-radio][value="and"]') as HTMLInputElement
    if (andRadio) andRadio.checked = true
  }
}

// ============================================
// MANEJADORES DE EVENTOS
// ============================================
function handleCreateValidation(): void {
  updateSelectedFields()
  updateUI()
}

function handleAddCondition(): void {
  const elements = getElements()

  const operator = elements.operatorSelect?.value
  const value = elements.valueInput?.value || ''

  if (state.selectedFieldsToHide.length === 0 || !operator) {
    alert('Por favor completa todos los campos requeridos')
    return
  }

  // Obtener operador lógico seleccionado
  let logicalOperator: 'and' | 'or' = 'and'
  const selectedRadio = document.querySelector('[data-logical-operator-radio]:checked') as HTMLInputElement
  if (selectedRadio) {
    logicalOperator = selectedRadio.value as 'and' | 'or'
  }

  // Crear una condición por cada campo seleccionado
  state.selectedFieldsToHide.forEach((field) => {
    const condition: HiddenCondition = {
      field,
      operator,
      value,
      logicalOperator,
    }

    addHiddenCondition(condition)
  })

  uncheckAllFieldCheckboxes()
  clearSelectedFields()
  resetForm()
  updateUI()
}

function handleDeleteCondition(index: number): void {
  removeHiddenCondition(index)
}

function handleFieldCheckboxChange(): void {
  updateSelectedFields()
  // Si no hay campos seleccionados, resetear
  if (state.selectedFieldsToHide.length === 0) {
    showEmptyStatePaso2()
  }
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners(): void {
  const elements = getElements()

  // Checkboxes de campos
  elements.fieldCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleFieldCheckboxChange)
  })

  // Botón crear validación
  elements.btnCreateValidation?.addEventListener('click', handleCreateValidation)

  // Botón agregar condición
  elements.btnAddCondition?.addEventListener('click', handleAddCondition)

  // Delegación para botones de eliminar
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const deleteBtn = target.closest('[data-btn-delete-condition]')

    if (deleteBtn) {
      const index = parseInt(deleteBtn.getAttribute('data-btn-delete-condition') || '0', 10)
      handleDeleteCondition(index)
    }
  })
}

// ============================================
// INICIALIZACIÓN
// ============================================
let initialized = false

export function initDocumentValidation(): void {
  if (initialized) return
  initialized = true

  // Reset state
  state.hiddenConditions = []
  state.selectedFieldsToHide = []

  // Setup event listeners
  setupEventListeners()

  // Estado inicial
  updateUI()
  updateDebugPanel({ hiddenConditions: state.hiddenConditions })
}

// Reset initialization flag for page transitions
export function resetDocumentValidation(): void {
  initialized = false
  state.hiddenConditions = []
  state.selectedFieldsToHide = []
}
