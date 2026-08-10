export interface AuthResponse {
  token: string
  user: Details
  clients: string[]
  permissions: Permissions
}

export interface Permissions {
  list: string[]
  byModule: ByModule
  total: number
}

export type ByModule = Record<string, string[]>

export interface Details {
  id: number
  uuid: string
  name: string
  lastName: string
  email: string
  country: string
  role: string
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
