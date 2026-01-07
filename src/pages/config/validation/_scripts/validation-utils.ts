// ============================================
// TIPOS COMPARTIDOS
// ============================================

export type ValidationRule = {
  required: boolean
  types: string[]
  customValidations: CustomValidation[]
  dateFormat: string | null
}

export type CustomValidation = {
  operator: string
  value: string
  logicalOperator: string
}

export type ValidationRules = Record<string, ValidationRule>

export type HiddenCondition = {
  field: string
  operator: string
  value: string
  logicalOperator: 'and' | 'or'
}

export type DocumentValidationState = {
  hiddenConditions: HiddenCondition[]
  selectedFieldsToHide: string[]
}

// ============================================
// FUNCIONES DE UTILIDAD COMPARTIDAS
// ============================================

const OPERATOR_SYMBOLS: Record<string, string> = {
  igual_a: '==',
  diferente_de: '!=',
  mayor_que: '>',
  menor_que: '<',
  mayor_que_igual_a: '>=',
  menor_que_igual_a: '<=',
  contiene: 'includes',
  expresion_regular: 'regex',
}

const OPERATOR_LABELS: Record<string, string> = {
  igual_a: 'Igual a (==)',
  diferente_de: 'Diferente de (!=)',
  mayor_que: 'Mayor que (>)',
  menor_que: 'Menor que (<)',
  mayor_que_igual_a: 'Mayor que o igual a (>=)',
  menor_que_igual_a: 'Menor que o igual a (<=)',
  contiene: 'Contiene (includes)',
  expresion_regular: 'Expresión regular (regex)',
}

export function getOperatorSymbol(operator: string): string {
  return OPERATOR_SYMBOLS[operator] || operator
}

export function getOperatorLabel(operator: string): string {
  return OPERATOR_LABELS[operator] || operator
}

export function createDefaultRule(): ValidationRule {
  return {
    required: false,
    types: [],
    customValidations: [],
    dateFormat: null,
  }
}

// ============================================
// DEBUG PANEL
// ============================================

export function getDebugContentElement(): HTMLElement | null {
  return document.getElementById('debug-content')
}

export function updateDebugPanel(data: { validationRules?: ValidationRules; hiddenConditions?: HiddenCondition[] }): void {
  const debugContent = getDebugContentElement()
  if (!debugContent) return

  // Obtener datos existentes y mergear
  let existingData: { validationRules?: ValidationRules; hiddenConditions?: HiddenCondition[] } = {}
  try {
    existingData = JSON.parse(debugContent.textContent || '{}')
  } catch {
    // Ignorar errores de parsing
  }

  const mergedData = {
    validationRules: data.validationRules ?? existingData.validationRules ?? {},
    hiddenConditions: data.hiddenConditions ?? existingData.hiddenConditions ?? [],
  }

  debugContent.textContent = JSON.stringify(mergedData, null, 2)
}
