import { defineMiddleware } from 'astro:middleware'

const publicRoutes = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/auth/inactivity', '/auth/register', '/_image']

const publicPatterns = [/^\/_actions\/.*/, /^\/.*\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|woff|woff2|ttf|eot)$/i]

const isPublicRoute = (pathname: string): boolean => {
  if (publicRoutes.includes(pathname)) return true

  return publicPatterns.some((pattern) => pattern.test(pathname))
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

  const response = await next()

  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
})
