import type { Designer } from '@pdfme/ui'
import type { PaginationManager } from '@/pdfme/pagination.js'

export type OutputTemplateResult = { template: any; renamed: string[] }

export type DocumentSettings = {
  pageSize: string
  marginType: string
  orientation: string
}

export type FieldOutOfBoundsIssue = {
  page: number
  name: string
  reason: string
}

export type EditorState = {
  designer: Designer | undefined
  pagination: PaginationManager | undefined
  isSyncingTemplate: boolean
  pendingTemplateUpdate: number | null
  isDirty: boolean
  isReady: boolean
  updatePaginationUI: () => void
}

export type EditorContext = {
  state: EditorState
  domContainer: HTMLElement
  getFullSyncedTemplate: () => any
  getOutputTemplate: () => OutputTemplateResult
  syncEditorWithOutputTemplate: (template: any) => void
  withSyncing: (fn: () => void) => void
  markDirty: () => void
  clearDirty: () => void
}
