import type { Schema } from '@pdfme/common'

export interface RichTextSchema extends Schema {
  /** Plantilla HTML con <b> y placeholders {var}. */
  text?: string
  /** Lista de nombres de variables detectados en `text`. */
  variables?: string[]
  fontName: string
  fontNameBold: string
  fontSize: number
  lineHeight?: number
  fontColor?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  verticalAlignment?: 'top' | 'middle' | 'bottom'
  underline?: boolean
  strikethrough?: boolean
}

export interface RichTextRun {
  text: string
  bold: boolean
  underline?: boolean
  strikethrough?: boolean
}

export interface RichTextLine {
  runs: RichTextRun[]
}
