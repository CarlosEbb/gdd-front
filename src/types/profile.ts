export interface User {
  token: string
  user: InfoUser
  workspaces: Workspace[]
}

export interface InfoUser {
  id: number
  name: string
  last_name: string
  email: string
  password: string
  photo: null
  country: string
  zip_code: string
  last_connection: Date
  status: null
  id_rol: number
  created_at: Date
  updated_at: Date
  failed_attempts: number
  access_expiration: Date
  uuid: string
}

export interface Workspace {
  id: number
  name: string
  icon: string
  created_at: Date
  updated_at: Date
}
