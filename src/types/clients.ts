export interface DetailsClient {
  id: number
  uuid: string
  nroDocumentsMax: number
  nroWorkspacesMax: number
  name: string
  rif: string
  logo: string
  createdAt: Date | string
  updatedAt: Date | string
  databases: Databases[]
  workspaces: Workspaces[]
  servers: Servers[]
  usersClients: UsersClient[]
}

export interface Servers {
  id: number
  idClient: number
  uuidClient: string
  idServer: number
  uuidServer: string
  createdAt: Date | string
  updatedAt: Date | string
  server: DetailsServer
}

export interface DetailsServer {
  id: number
  uuid: string
  ip: string
  name: string | null
  puerto: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Databases {
  id: number
  uuid: string
  nameBd: string
  username: string
  password: string
  idServer: number
  uuidServer: string
  idClient: number
  uuidClient: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Workspaces {
  id: number
  uuid: string
  name: string
  icon: string
  idClient: number
  uuidClient: string
  idDataBase: number
  uuidDataBase: string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface UsersClient {
  id: number
  idClient: number
  uuidClient: string
  idUser: number
  uuidUser: string
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface User {
  uuid: string
  name: string
  lastName: string
  email: string
}
