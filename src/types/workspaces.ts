export interface NewWorkspace {
  id: number
  name: string
  icon: string
  created_at: Date
  updated_at: Date
  uuid: string
}

export interface DetailsWorkspace extends NewWorkspace {
  is_owner: boolean
}

export interface WorkspaceByUser {
  id: number
  name: string
  email: string
  is_owner: boolean
  created_at: Date
}

export interface AssignUser {
  id: number
  user_id: number
  workspace_id: number
  is_owner: boolean
  created_at: string
  updated_at: string
}
