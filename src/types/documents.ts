type Status = 'active' | 'deleted'

export interface Document {
  id: number
  uuid: string
  title: string
  name: string
  description: string
  openDate: string
  uuidWorkspace: string
  createdAt: string
  updatedAt: string
  status: string
  lastVersion: LastVersion
  owner: Owner
  workspace: Workspace
}

export interface Workspace {
  name: string
  icon: string
}

export interface Owner {
  id?: number
  uuid?: string
  name: string
  lastName: string
  photo: string
  email?: string
}

export interface LastVersion {
  id: number
  uuid: string
  nameVersion: string
  buildNumber: string
  pathThumbnails: string
  pathJson: string
  idTemplate: number
  uuidTemplate: string
  idValidation: null
  uuidValidation: null
  createdAt: string
  updatedAt: string
}

export interface CreateDocument {
  template: InfoNewDocument
  lastVersion: LastVersion
}

export interface InfoNewDocument {
  id: number
  title: string
  name: string
  description: string
  openDate: Date
  idWorkspace: number
  createdAt: Date
  updatedAt: Date
  status: string
  uuidWorkspace: string
  uuid: string
}

export interface InfoNewVersion {
  id: number
  idTemplate: number
  uuidTemplate: string
  idValidation: number
  uuidValidation: string
  nameVersion: string
  buildNumber: string
  pathThumbnails: string
  pathJson: string
  createdAt: Date
  status: string
  uuid: string
}

export interface CreateNewVersion {
  lastVersion: LastVersion
  pageConfigUpdated: boolean
}

export interface Version {
  id: number
  id_template: number
  name_version: string
  build_number: string
  path_thumbnails: string
  path_json: string
  created_by: number
  created_at: Date
  status: string
  uuid: string
}

export interface SchemaFile {
  schemas: Array<any[]>
  basePdf: BasePDF
  pdfmeVersion: string
}

export interface BasePDF {
  width: number
  height: number
  padding: number[]
}

export interface GeneratedDocument {
  template: Template
  stats: Stats
  pagination: Pagination
  documents: DocumentGenerated[]
}

export interface DocumentGenerated {
  id: number
  uuid: string
  json: Record<string, any>
  id_template: number
  build_number: string
  encrypt: null | string
  status: 'ACTIVO' | 'ERROR' | 'DESHABILITADO' | 'ANULADO'
  response_status: string
  response_data: ResponseDocumentGenerated
  error_details: null | string
  created_at: string
  status: Status
  encrypt: string
}

export interface Template {
  id: number
  title: string
  name: string
  description: string
  open_date: string
  id_workspace: number
  created_at: string
  updated_at: string
  status: Status
  uuid: string
  jwt_token: string
}

export interface RequestForDocument {
  uuid_template?: string
  build_number?: string
  name_version?: string
  uuid_version: string
  jwtToken?: string
  variables: Record<string, any>
  elementos: string[]
  template: Template
}
