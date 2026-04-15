export interface User {
  token: string
  user: Details
  permissions: Permissions
}

export interface Permissions {
  list: string[]
  byModule: ByModule
  total: number
}

export interface ByModule {
  users: string[]
  admin: string[]
  workspaces: string[]
  permissions: string[]
  clients: string[]
  servers: string[]
  databases: string[]
}

export interface Details {
  id: number
  uuid: string
  name: string
  lastName: string
  email: string
  country: string
  zipCode: string
  status: string
  photo: string
  lastConnection: string
  createdAt: string
  updatedAt: string
}

export interface GetUserByUuidResponse extends Details {
  permissionUuids: string[]
  clientUuids: string[]
}

export enum Status {
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO',
}
