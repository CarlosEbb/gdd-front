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
  name: string
  lastName: string
  photo: string
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
  version: Version
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
  variables: Record<string, any>
  elementos: string[]
}

type Status = 'active' | 'deleted'
