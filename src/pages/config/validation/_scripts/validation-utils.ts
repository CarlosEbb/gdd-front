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

export type ValidationPayload = {
  validationRules: ValidationRules
  hiddenConditions: HiddenCondition[]
}

const validationPayload: ValidationPayload = {
  validationRules: {},
  hiddenConditions: [],
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

export function hasValidationContent(rule: ValidationRule): boolean {
  return rule.required || rule.types.length > 0 || rule.customValidations.length > 0
}

export function filterEmptyRules(rules: ValidationRules): ValidationRules {
  const filtered: ValidationRules = {}
  for (const [field, rule] of Object.entries(rules)) {
    if (hasValidationContent(rule)) {
      filtered[field] = rule
    }
  }
  return filtered
}

// ============================================
// DEBUG PANEL
// ============================================

export function getDebugContentElement(): HTMLElement | null {
  return document.getElementById('debug-content')
}

export function updateDebugPanel(data: { validationRules?: ValidationRules; hiddenConditions?: HiddenCondition[] }): void {
  const rawRules = data.validationRules ?? validationPayload.validationRules ?? {}
  validationPayload.validationRules = filterEmptyRules(rawRules)
  validationPayload.hiddenConditions = data.hiddenConditions ?? validationPayload.hiddenConditions ?? []

  const debugContent = getDebugContentElement()
  if (debugContent) {
    debugContent.textContent = JSON.stringify(validationPayload, null, 2)
  }
}

export function getValidationPayload(): ValidationPayload {
  return {
    validationRules: filterEmptyRules(validationPayload.validationRules),
    hiddenConditions: validationPayload.hiddenConditions,
  }
}
