export interface AuthResponse {
  token: string
  user: User
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
  ejemplo: string[]
}

export interface User {
  id: number
  uuid: string
  name: string
  lastName: string
  email: string
  country: string
  zipCode: string
  status: string
  photo: string
  lastConnection: Date
  createdAt: Date
  updatedAt: Date
}
