export interface User {
  token: string
  user: InfoProfile
  workspaces: Workspace[]
}

export interface InfoProfile {
  id: number
  uuid: string
  name: string
  lastName: string
  email: string
  country: string
  zipCode: string
  status: string
  photo: null
  lastConnection: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: number
  name: string
  icon: string
  created_at: Date
  updated_at: Date
}
