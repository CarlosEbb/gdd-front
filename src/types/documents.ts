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
  id: number
  uuid: string
  id_template: number
  created_at: string
  status: Status
}

export interface RequestForDocument {
  uuid_template?: string
  build_number?: string
  name_version?: string
  uuid_version: string
  jwtToken?: string
  variables: Record<string, any>
  elementos: string[]
}

export interface DocumentVersion {
  template: Template
  versions: InfoVersion[]
}

export interface InfoVersion {
  id: number
  uuid: string
  nameVersion: string
  buildNumber: string
  pathThumbnails: string
  pathJson: string
  ipAddress: string
  idUser: number
  uuidUser: string
  idTemplate: number
  uuidTemplate: string
  idValidation: null
  uuidValidation: null
  createdAt: string
  updatedAt: string
  isPublished: boolean
  publishedBy: PublishedBy | null
}

export interface PublishedBy {
  id: number
  uuid: string
  name: string
  lastName: string
  photo: string | null
}

export interface Template {
  title: string
  name: string
  description: string
}

export interface DocumentVersionHistory {
  id: number
  uuid: string
  nameVersion: string
  buildNumber: string
  pathThumbnails: string
  pathJson: string
  ipAddress: null | string
  idUser: number | null
  uuidUser: null | string
  idTemplate: number
  uuidTemplate: string
  idValidation: null
  uuidValidation: null
  createdAt: string
  updatedAt: string
  user: User | null
  publication: Publication | null
}

export interface Publication {
  id: number
  uuid: string
  publishedDate: string
  idUser: number
  uuidUser: string
  idTemplate: number
  uuidTemplate: string
  idVersion: number
  uuidVersion: string
  createdAt: string
  updatedAt: string
  user: User
}

export interface User {
  id: number
  uuid: string
  name: string
  lastName: string
  email?: string
}

type Status = 'active' | 'deleted'
