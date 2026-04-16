interface RoutePolicy {
  pattern: RegExp
  permissions: string[]
  mode: 'any' | 'all'
}

/**
 * Mapa declarativo de políticas por ruta.
 * Las rutas más específicas deben ir primero ya que se evalúan en orden.
 * Si una ruta no coincide con ningún patrón, solo se requiere autenticación.
 */
const routePolicies: RoutePolicy[] = [
  // --- Users ---
  { pattern: /^\/users\/new$/, permissions: ['users.create'], mode: 'any' },
  { pattern: /^\/users\/[^/]+\/edit$/, permissions: ['users.update'], mode: 'any' },
  { pattern: /^\/users(\/|$)/, permissions: ['users.view'], mode: 'any' },

  // --- Clients ---
  { pattern: /^\/clients\/new$/, permissions: ['clients.create'], mode: 'any' },
  { pattern: /^\/clients\/[^/]+\/edit$/, permissions: ['clients.update'], mode: 'any' },
  { pattern: /^\/clients(\/|$)/, permissions: ['clients.view'], mode: 'any' },

  // --- Servers ---
  { pattern: /^\/servers\/new$/, permissions: ['servers.create'], mode: 'any' },
  { pattern: /^\/servers\/[^/]+\/edit$/, permissions: ['servers.update'], mode: 'any' },
  { pattern: /^\/servers(\/|$)/, permissions: ['servers.view'], mode: 'any' },

  // --- Workspaces ---
  { pattern: /^\/workspaces\/new$/, permissions: ['workspaces.create'], mode: 'any' },
  { pattern: /^\/workspaces\/[^/]+\/edit$/, permissions: ['workspaces.update'], mode: 'any' },
  { pattern: /^\/workspaces(\/|$)/, permissions: ['workspaces.view'], mode: 'any' },

  // --- Databases ---
  { pattern: /^\/databases\/new$/, permissions: ['databases.create'], mode: 'any' },
  { pattern: /^\/databases\/[^/]+\/edit$/, permissions: ['databases.update'], mode: 'any' },
  { pattern: /^\/databases(\/|$)/, permissions: ['databases.view'], mode: 'any' },

  // --- Documents ---
  { pattern: /^\/documents\/new$/, permissions: ['documents.create'], mode: 'any' },
  { pattern: /^\/documents\/[^/]+\/edit$/, permissions: ['documents.update'], mode: 'any' },
  { pattern: /^\/documents(\/|$)/, permissions: ['documents.view'], mode: 'any' },

  // --- Templates ---
  { pattern: /^\/templates\/new$/, permissions: ['documents.create'], mode: 'any' },

  // --- Permissions (config) ---
  { pattern: /^\/config\/security(\/|$)/, permissions: ['permissions.view'], mode: 'any' },
]

/**
 * Obtiene la política de permisos requerida para una ruta.
 * Retorna `null` si la ruta no tiene política definida (solo requiere autenticación).
 */
export function getRoutePolicy(pathname: string): RoutePolicy | null {
  for (const policy of routePolicies) {
    if (policy.pattern.test(pathname)) {
      return policy
    }
  }
  return null
}
