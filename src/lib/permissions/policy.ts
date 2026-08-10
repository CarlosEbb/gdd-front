import type { PermissionData } from './types'

const SUPERADMIN_PERMISSION = 'admin.full'

/**
 * Verifica si el usuario es superadmin (tiene `admin.full`).
 */
export function isSuperAdmin(permissions: PermissionData): boolean {
  return permissions.list.includes(SUPERADMIN_PERMISSION)
}

/**
 * Verifica si el usuario tiene un permiso específico.
 * Retorna `true` automáticamente si es superadmin.
 */
export function hasPermission(permissions: PermissionData, permission: string): boolean {
  if (isSuperAdmin(permissions)) return true
  return permissions.list.includes(permission)
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos indicados (OR lógico).
 * Retorna `true` automáticamente si es superadmin.
 */
export function hasAnyPermission(permissions: PermissionData, requiredPermissions: string[]): boolean {
  if (isSuperAdmin(permissions)) return true
  return requiredPermissions.some((p) => permissions.list.includes(p))
}

/**
 * Verifica si el usuario tiene todos los permisos indicados (AND lógico).
 * Retorna `true` automáticamente si es superadmin.
 */
export function hasAllPermissions(permissions: PermissionData, requiredPermissions: string[]): boolean {
  if (isSuperAdmin(permissions)) return true
  return requiredPermissions.every((p) => permissions.list.includes(p))
}

/**
 * Verifica si el usuario tiene acceso a cualquier operación de un módulo.
 * Retorna `true` automáticamente si es superadmin.
 */
export function hasModuleAccess(permissions: PermissionData, module: string): boolean {
  if (isSuperAdmin(permissions)) return true
  return module in permissions.byModule && permissions.byModule[module].length > 0
}
