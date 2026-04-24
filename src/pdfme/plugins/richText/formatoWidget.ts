import type { PropPanelWidgetProps } from '@pdfme/common'

// Iconos inline (lucide-like) que se renderizan en los botones.
const ICONS = {
  strikethrough:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>',
  underline:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>',
  alignLeft:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
  alignCenter:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>',
  alignRight:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>',
  alignJustify:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>',
  alignTop:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V8"/><path d="m7 13 5-5 5 5"/><line x1="4" y1="4" x2="20" y2="4"/></svg>',
  alignMiddle:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><path d="M12 3v5"/><path d="m9 6 3-3 3 3"/><path d="M12 21v-5"/><path d="m9 18 3 3 3-3"/></svg>',
  alignBottom:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><line x1="4" y1="20" x2="20" y2="20"/></svg>',
} as const

type IconKey = keyof typeof ICONS

interface ButtonConfig {
  icon: IconKey
  title: string
  isActive: (schema: Record<string, unknown>) => boolean
  onClick: (schema: Record<string, unknown>) => Array<{ key: string; value: unknown }>
}

const BUTTON_STYLE = {
  width: '32px',
  height: '28px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #d9d9d9',
  background: '#ffffff',
  color: '#595959',
  cursor: 'pointer',
  padding: '0',
  boxSizing: 'border-box' as const,
}

const ACTIVE_STYLE = {
  background: '#e6f4ff',
  borderColor: '#1677ff',
  color: '#1677ff',
}

const applyStyle = (el: HTMLElement, style: Record<string, string>) => {
  for (const [k, v] of Object.entries(style)) {
    ;(el.style as any)[k] = v
  }
}

const createButton = (cfg: ButtonConfig, schema: Record<string, unknown>, onChange: (updates: Array<{ key: string; value: unknown }>) => void, isFirst: boolean, isLast: boolean): HTMLButtonElement => {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.title = cfg.title
  btn.innerHTML = ICONS[cfg.icon]
  applyStyle(btn, BUTTON_STYLE)
  // Radios: bordes compartidos, solo el primero redondea a la izquierda y el último a la derecha.
  btn.style.borderRadius = isFirst ? '4px 0 0 4px' : isLast ? '0 4px 4px 0' : '0'
  if (!isFirst) btn.style.borderLeft = 'none'

  if (cfg.isActive(schema)) applyStyle(btn, ACTIVE_STYLE)

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    onChange(cfg.onClick(schema))
  })

  return btn
}

const createGroup = (configs: ButtonConfig[], schema: Record<string, unknown>, onChange: (updates: Array<{ key: string; value: unknown }>) => void): HTMLElement => {
  const group = document.createElement('div')
  group.style.display = 'inline-flex'
  group.style.marginRight = '8px'
  configs.forEach((cfg, idx) => {
    group.appendChild(createButton(cfg, schema, onChange, idx === 0, idx === configs.length - 1))
  })
  return group
}

export const formatoButtonsWidget = (props: PropPanelWidgetProps) => {
  const { rootElement, activeSchema, changeSchemas } = props as any
  const schema = activeSchema as Record<string, unknown>

  // Limpiar contenedor para redibujar con el estado actual.
  rootElement.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.style.display = 'flex'
  wrapper.style.flexDirection = 'column'
  wrapper.style.gap = '8px'
  wrapper.style.padding = '4px 0'

  const label = document.createElement('div')
  label.textContent = 'Formato'
  label.style.fontSize = '14px'
  label.style.fontWeight = '500'
  label.style.color = '#262626'
  wrapper.appendChild(label)

  const row = document.createElement('div')
  row.style.display = 'flex'
  row.style.flexWrap = 'wrap'
  row.style.gap = '4px'

  const onChange = (updates: Array<{ key: string; value: unknown }>) => {
    changeSchemas(updates.map((u) => ({ ...u, schemaId: (activeSchema as any).id })))
  }

  // Grupo 1: decoraciones (S, U).
  const decorations: ButtonConfig[] = [
    {
      icon: 'strikethrough',
      title: 'Tachado',
      isActive: (s) => !!s.strikethrough,
      onClick: (s) => [{ key: 'strikethrough', value: !s.strikethrough }],
    },
    {
      icon: 'underline',
      title: 'Subrayado',
      isActive: (s) => !!s.underline,
      onClick: (s) => [{ key: 'underline', value: !s.underline }],
    },
  ]

  // Grupo 2: alineación horizontal.
  const hAlign: ButtonConfig[] = [
    {
      icon: 'alignLeft',
      title: 'Alinear a la izquierda',
      isActive: (s) => (s.alignment || 'left') === 'left',
      onClick: () => [{ key: 'alignment', value: 'left' }],
    },
    {
      icon: 'alignCenter',
      title: 'Centrar',
      isActive: (s) => s.alignment === 'center',
      onClick: () => [{ key: 'alignment', value: 'center' }],
    },
    {
      icon: 'alignRight',
      title: 'Alinear a la derecha',
      isActive: (s) => s.alignment === 'right',
      onClick: () => [{ key: 'alignment', value: 'right' }],
    },
    {
      icon: 'alignJustify',
      title: 'Justificar',
      isActive: (s) => s.alignment === 'justify',
      onClick: () => [{ key: 'alignment', value: 'justify' }],
    },
  ]

  // Grupo 3: alineación vertical.
  const vAlign: ButtonConfig[] = [
    {
      icon: 'alignTop',
      title: 'Alinear arriba',
      isActive: (s) => (s.verticalAlignment || 'top') === 'top',
      onClick: () => [{ key: 'verticalAlignment', value: 'top' }],
    },
    {
      icon: 'alignMiddle',
      title: 'Centrar verticalmente',
      isActive: (s) => s.verticalAlignment === 'middle',
      onClick: () => [{ key: 'verticalAlignment', value: 'middle' }],
    },
    {
      icon: 'alignBottom',
      title: 'Alinear abajo',
      isActive: (s) => s.verticalAlignment === 'bottom',
      onClick: () => [{ key: 'verticalAlignment', value: 'bottom' }],
    },
  ]

  row.appendChild(createGroup(decorations, schema, onChange))
  row.appendChild(createGroup(hAlign, schema, onChange))
  row.appendChild(createGroup(vAlign, schema, onChange))

  wrapper.appendChild(row)
  rootElement.appendChild(wrapper)
}
