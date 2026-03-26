interface ImportMetaEnv {
  readonly API_URL: string
  readonly PUBLIC_PROJECT_URL: string
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
