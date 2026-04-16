import { defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import type { PermissionCategory } from '@/types/permissions'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const permissions = {
  get: defineAction({
    handler: async (input, request) => {
      await requirePermission(request, ['permissions.view'])
      const token = await requireAuth(request)

      try {
        const permissions = await http.get<PermissionCategory[]>('/permissions', token)
        return permissions
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
