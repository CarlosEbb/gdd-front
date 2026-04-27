import type { PropPanel } from '@pdfme/common'
import type { RichTextSchema } from './types'
import { formatoButtonsWidget } from './formatoWidget'
import { variablesSampleDataWidget } from './variablesSampleDataWidget'

export const propPanel: PropPanel<RichTextSchema> = {
  widgets: {
    formatoButtons: formatoButtonsWidget,
    variablesSampleData: variablesSampleDataWidget,
  },
  schema: ({ options }) => {
    const fontNames = Object.keys(((options as any)?.font as Record<string, unknown>) || {})
    const fontEnum = fontNames.length > 0 ? fontNames : ['Roboto']

    return {
      fontName: {
        title: 'Fuente (Regular)',
        type: 'string',
        widget: 'select',
        props: {
          options: fontEnum.map((f) => ({ label: f, value: f })),
        },
        span: 12,
      },
      fontNameBold: {
        title: 'Fuente (Negrita)',
        type: 'string',
        widget: 'select',
        props: {
          options: fontEnum.map((f) => ({ label: f, value: f })),
        },
        span: 12,
      },
      fontSize: {
        title: 'Tamaño',
        type: 'number',
        widget: 'inputNumber',
        props: { min: 6, max: 144 },
        span: 8,
      },
      lineHeight: {
        title: 'Interlineado',
        type: 'number',
        widget: 'inputNumber',
        props: { min: 1, max: 3, step: 0.1 },
        span: 8,
      },
      fontColor: {
        title: 'Color',
        type: 'string',
        widget: 'color',
        span: 8,
      },
      formatDivider: {
        type: 'void',
        widget: 'Divider',
      },
      formato: {
        type: 'object',
        widget: 'formatoButtons',
        bind: false,
        span: 24,
      },
      variablesDivider: {
        type: 'void',
        widget: 'Divider',
      },
      variablesSample: {
        type: 'object',
        widget: 'variablesSampleData',
        bind: false,
        span: 24,
      },
    }
  },
  defaultSchema: {
    name: '',
    type: 'richText',
    text: 'Escribe aquí tu <b>texto</b>',
    variables: [],
    content: '',
    position: { x: 0, y: 0 },
    width: 80,
    height: 20,
    fontSize: 13,
    fontName: 'Roboto',
    fontNameBold: 'Roboto-Bold',
    fontColor: '#000000',
    alignment: 'left',
    verticalAlignment: 'top',
    underline: false,
    strikethrough: false,
    lineHeight: 1.2,
  },
}
