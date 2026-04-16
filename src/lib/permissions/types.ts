export type Module =
  | 'users'
  | 'admin'
  | 'workspaces'
  | 'permissions'
  | 'clients'
  | 'servers'
  | 'databases'
  | 'templates'

export type Operation =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'full'
  | 'assign'

export type PermissionString = `${Module}.${Operation}`

export interface PermissionData {
  list: string[]
  byModule: Record<string, string[]>
  total: number
}
