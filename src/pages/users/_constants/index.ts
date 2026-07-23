export interface QuickRoleConfig {
  label: string
  permissions: string[]
}

export const quickRoleConfigs: Record<string, QuickRoleConfig> = {
  admin: {
    label: 'Administrador',
    permissions: ['admin.full'],
  },
  client: {
    label: 'Cliente',
    permissions: [
      'clients.view',
      'documents.create',
      'documents.view',
      'documents.update',
      'documents.delete',
      'workspaces.create',
      'workspaces.delete',
      'workspaces.manage',
      'workspaces.update',
      'workspaces.view',
      'templates.create',
      'templates.publish',
      'templates.delete',
      'templates.update',
      'templates.view',
      'servers.view',
      'users.view',
    ],
  },
}
