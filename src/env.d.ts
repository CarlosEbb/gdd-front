interface ImportMetaEnv {
  readonly API_URL: string
  readonly PUBLIC_PROJECT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __applyTheme?: () => void
}

declare namespace App {
  interface SessionData {
    user: import('@/types/users').Details
    token: string
    permissions: import('@/lib/permissions/types').PermissionData
    workspaces: Workspace[]
  }
}
