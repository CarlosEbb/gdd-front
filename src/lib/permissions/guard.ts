import { ActionError } from 'astro:actions'
import type { ActionAPIContext } from 'astro:actions'
import type { PermissionData } from './types'
import { hasAnyPermission, hasAllPermissions } from './policy'

/**
 * Verifica que la sesión tenga los permisos requeridos para ejecutar un action.
 * Lanza `ActionError` con código `FORBIDDEN` si no cumple.
 *
 * @param request - Contexto del action de Astro
 * @param permissions - Lista de permisos requeridos
 * @param mode - 'any' (al menos uno) o 'all' (todos). Default: 'any'
 *
 * @example
 * ```ts
 * handler: async (input, request) => {
 *   await requirePermission(request, ['users.create'])
 *   // ... lógica del action
 * }
 * ```
 */
export async function requirePermission(
  request: ActionAPIContext,
  permissions: string[],
  mode: 'any' | 'all' = 'any'
): Promise<void> {
  const hasToken = await request.session?.has('token')

  if (!hasToken) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'No autorizado. Inicia sesión de nuevo.',
    })
  }

  const userPermissions = (await request.session?.get('permissions')) as PermissionData | undefined

  if (!userPermissions) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos asignados.',
    })
  }

  const check = mode === 'all' ? hasAllPermissions : hasAnyPermission
  const isAllowed = check(userPermissions, permissions)

  if (!isAllowed) {
    throw new ActionError({
      code: 'FORBIDDEN',
      message: 'No tienes permisos para realizar esta acción.',
    })
  }
}

/**
 * Obtiene el token de la sesión o lanza un error de autenticación.
 */
export async function requireAuth(request: ActionAPIContext): Promise<string> {
  const hasToken = await request.session?.has('token')

  if (!hasToken) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'No autorizado. Inicia sesión de nuevo.',
    })
  }

  return (await request.session?.get('token')) as string
}
