interface ImportMetaEnv {
  readonly API_URL: string
  readonly PROJECT_URL: string
  readonly PUBLIC_NAME_PROJECT: string
  readonly PUBLIC_TOKEN_EXPIRATION: string
  readonly PUBLIC_TOKEN_EXPIRATION_SHOW_MODAL: string
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
