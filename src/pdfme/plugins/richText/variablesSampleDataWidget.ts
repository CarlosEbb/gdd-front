import type { PropPanelWidgetProps } from '@pdfme/common'
import { parseVariableValues } from './helper'

const CARD_STYLE: Record<string, string> = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginTop: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
}

const TITLE_STYLE: Record<string, string> = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0',
}

const FIELD_STYLE: Record<string, string> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const LABEL_STYLE: Record<string, string> = {
  fontSize: '13px',
  color: '#4b5563',
}

const INPUT_STYLE: Record<string, string> = {
  width: '100%',
  padding: '6px 11px',
  border: '1px solid #d9d9d9',
  borderRadius: '6px',
  fontSize: '13px',
  color: '#1f2937',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#ffffff',
}

const applyStyle = (el: HTMLElement, style: Record<string, string>) => {
  for (const [k, v] of Object.entries(style)) {
    ;(el.style as any)[k] = v
  }
}

export const variablesSampleDataWidget = (props: PropPanelWidgetProps) => {
  const { rootElement, activeSchema, changeSchemas } = props as any
  const schema = activeSchema as Record<string, unknown> & { id?: string; variables?: string[]; content?: string }

  rootElement.innerHTML = ''
  rootElement.style.width = '100%'
  rootElement.style.display = 'block'

  // form-render envuelve cada widget en un .ant-form-item con dos columnas
  // (label + control). Para que la card ocupe todo el panel forzamos el
  // ítem padre a tomar el ancho completo y eliminamos la columna de label.
  const formItem = rootElement.closest('.ant-form-item') as HTMLElement | null
  if (formItem) {
    formItem.style.width = '100%'
    formItem.style.maxWidth = '100%'
    formItem.style.margin = '0'
    const row = formItem.querySelector('.ant-row') as HTMLElement | null
    if (row) row.style.width = '100%'
    const labelCol = formItem.querySelector('.ant-form-item-label') as HTMLElement | null
    if (labelCol) labelCol.style.display = 'none'
    const controlCol = formItem.querySelector('.ant-form-item-control') as HTMLElement | null
    if (controlCol) {
      controlCol.style.width = '100%'
      controlCol.style.maxWidth = '100%'
      controlCol.style.flex = '0 0 100%'
    }
  }

  const variables = Array.isArray(schema.variables) ? (schema.variables as string[]) : []
  if (variables.length === 0) {
    // Sin variables, no se muestra la card.
    return
  }

  const values = parseVariableValues(typeof schema.content === 'string' ? schema.content : '')

  const card = document.createElement('div')
  applyStyle(card, CARD_STYLE)

  const title = document.createElement('h4')
  title.textContent = 'Variables Sample Data'
  applyStyle(title, TITLE_STYLE)
  card.appendChild(title)

  const persist = () => {
    const next: Record<string, string> = {}
    for (const v of variables) {
      const val = values[v]
      if (val !== undefined && val !== null) next[v] = val
    }
    changeSchemas([{ key: 'content', value: JSON.stringify(next), schemaId: schema.id }])
  }

  variables.forEach((variableName) => {
    const fieldWrapper = document.createElement('div')
    applyStyle(fieldWrapper, FIELD_STYLE)

    const label = document.createElement('label')
    label.textContent = variableName
    applyStyle(label, LABEL_STYLE)

    const input = document.createElement('input')
    input.type = 'text'
    input.value = values[variableName] ?? ''
    input.placeholder = `Valor de ${variableName}`
    applyStyle(input, INPUT_STYLE)

    input.addEventListener('focus', () => {
      input.style.borderColor = '#1677ff'
      input.style.boxShadow = '0 0 0 2px rgba(22, 119, 255, 0.1)'
    })
    input.addEventListener('blur', () => {
      input.style.borderColor = '#d9d9d9'
      input.style.boxShadow = 'none'
      const newValue = input.value
      if (values[variableName] !== newValue) {
        values[variableName] = newValue
        persist()
      }
    })

    fieldWrapper.appendChild(label)
    fieldWrapper.appendChild(input)
    card.appendChild(fieldWrapper)
  })

  rootElement.appendChild(card)
}
