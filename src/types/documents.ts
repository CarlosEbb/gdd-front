export interface Document {
  id: number
  uuid: string
  title: string
  name: string
  description: string
  open_date: string
  id_workspace: number
  created_at: string
  updated_at: string
  status: string
  last_version: LastVersion
}

export interface LastVersion {
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

export interface CreateDocument {
  template: InfoNewDocument
  version: InfoNewVersion
}

export interface InfoNewDocument {
  id: number
  title: string
  name: string
  description: string
  open_date: Date
  id_workspace: number
  created_at: Date
  updated_at: Date
  status: string
  uuid: string
}

export interface InfoNewVersion {
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

type Status = 'active' | 'deleted'
