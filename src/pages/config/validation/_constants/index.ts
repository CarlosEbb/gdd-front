import type { icons } from '@lucide/astro'

export type TypeDataItem = {
  value: string
  label: string
  icon: keyof typeof icons
}

export type OperatorItem = {
  value: string
  label: string
}

export type DateFormatItem = {
  value: string
  label: string
}

export const TYPES_DATA: TypeDataItem[] = [
  { value: 'String', label: 'Texto', icon: 'FileText' },
  { value: 'Number', label: 'Número', icon: 'Hash' },
  { value: 'Boolean', label: 'Boolean', icon: 'ToggleLeft' },
  { value: 'Array', label: 'Array', icon: 'Brackets' },
  { value: 'Object', label: 'Object', icon: 'Braces' },
  { value: 'Date', label: 'Date', icon: 'Calendar' },
]

export const OPERATORS: OperatorItem[] = [
  { value: 'igual_a', label: 'Igual a (==)' },
  { value: 'diferente_de', label: 'Diferente de (!=)' },
  { value: 'mayor_que', label: 'Mayor que (>)' },
  { value: 'menor_que', label: 'Menor que (<)' },
  { value: 'mayor_que_igual_a', label: 'Mayor que o igual a (>=)' },
  { value: 'menor_que_igual_a', label: 'Menor que o igual a (<=)' },
  { value: 'contiene', label: 'Contiene (includes)' },
  { value: 'expresion_regular', label: 'Expresión regular (regex)' },
]

export const OPERATORS_LOGICAL: OperatorItem[] = [
  { value: 'and', label: 'AND' },
  { value: 'or', label: 'OR' },
]

export const TYPES_DATE: DateFormatItem[] = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-20)' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (12-20-2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/20/2024)' },
  { value: 'DD de MMMM de YYYY', label: 'DD de MMMM de YYYY (20 de diciembre de 2024)' },
  { value: 'custom', label: 'Personalizado' },
]

export const PARTS_VALIDATION: string[] = ['Header', 'Body', 'Footer', 'Signature', 'Signatures', 'Attachments', 'Metadata', 'Custom', 'Other', 'All', 'None', 'Any']
