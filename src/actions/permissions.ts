import { ActionError, defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import type { PermissionCategory } from '@/types/permissions'

export const permissions = {
  get: defineAction({
    handler: async (input, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const permissions = await http.get<PermissionCategory[]>('/permissions', token)
        return permissions
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
