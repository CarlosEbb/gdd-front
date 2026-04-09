export interface WorkspaceCreate {
  name: string
  icon: string
  clientUuid: string
  serverUuid: string
}

export interface Workspace {
  id: number
  uuid: string
  name: string
  icon: string
  idClient: number
  uuidClient: string
  idDataBase: number
  uuidDataBase: string
  createdAt: string
  updatedAt: string
  status: string
  deletedAt: null
  client: Client
  dataBase: DataBase
  templates: any[]
}

export interface Client {
  id: number
  uuid: string
  nroDocumentsMax: number
  nroWorkspacesMax: number
  name: string
  rif: string
  logo: string
  createdAt: string
  updatedAt: string
}

export interface DataBase {
  id: number
  uuid: string
  nameBd: string
  username: string
  password: string
  idServer: number
  uuidServer: string
  idClient: number
  uuidClient: string
  createdAt: string
  updatedAt: string
  server: Server
}

export interface Server {
  id: number
  uuid: string
  name: null
  ip: string
  puerto: number
  createdAt: string
  updatedAt: string
}
