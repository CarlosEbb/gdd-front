import { ActionError, defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import type { Templates } from '@/types/templates'

export const templates = {
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
        const templates = await http.get<Templates>(`/category/all`, token)
        return templates
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
