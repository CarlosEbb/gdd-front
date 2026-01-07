interface ImportMetaEnv {
  readonly API_URL: string
  readonly PROJECT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace App {
  interface SessionData {
    user: InfoUser
    token: string
    workspaces: Workspace[]
  }
}
