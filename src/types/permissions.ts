export interface PermissionCategory {
  category: string
  permissions: Permission[]
}

export interface Permission {
  id: number
  uuid: string
  name: string
  displayName: string
  category: string
  createdAt: Date
  updatedAt: Date
}
