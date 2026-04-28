import { defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import type { Templates } from '@/types/templates'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const templates = {
  get: defineAction({
    handler: async (input, request) => {
      await requirePermission(request, ['templates.view', 'templates.create'])
      const token = await requireAuth(request)

      try {
        const templates = await http.get<Templates[]>('/category/all', token, request)
        return templates
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
