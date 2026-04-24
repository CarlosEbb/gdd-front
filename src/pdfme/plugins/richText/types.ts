import type { Schema } from '@pdfme/common'

export interface RichTextSchema extends Schema {
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
}

export interface RichTextLine {
  runs: RichTextRun[]
}
