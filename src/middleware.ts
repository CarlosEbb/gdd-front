import { defineMiddleware } from 'astro:middleware'
import { getRoutePolicy } from '@/lib/permissions/routes'
import { hasAnyPermission, hasAllPermissions } from '@/lib/permissions/policy'
import type { PermissionData } from '@/lib/permissions/types'

const publicRoutes = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/inactivity', '/auth/register', '/_image']

const publicPatterns = [/^\/_actions\/.*/, /^\/.*\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i]

const noAuthorizationRoutes = ['/home', '/profile', '/403', '/404']

const isPublicRoute = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true

  return publicPatterns.some((pattern) => pattern.test(pathname))
}

const skipAuthorization = (pathname: string): boolean => {
  return noAuthorizationRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  const token = await context.session?.get('token')

  if (isPublicRoute(pathname)) {
    return next()
  }

  if (!token) {
    return context.redirect('/auth/login')
  }

  if (!skipAuthorization(pathname)) {
    const policy = getRoutePolicy(pathname)

    if (policy) {
      const permissions = (await context.session?.get('permissions')) as PermissionData | undefined

      if (!permissions) {
        return context.redirect('/403')
      }

      const check = policy.mode === 'all' ? hasAllPermissions : hasAnyPermission
      const isAllowed = check(permissions, policy.permissions)

      if (!isAllowed) {
        return context.redirect('/403')
      }
    }
  }

  const response = await next()

  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
})
