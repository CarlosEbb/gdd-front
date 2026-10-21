import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { requirePermission, requireAuth } from '@/lib/permissions'
import type { ApiResponse } from '@/types/response'
import type { ServiceTokenGenerateData, ServiceTokenDeleteData } from '@/types/serviceToken'
import { handleApiError, http } from './http'

const clientUuidInput = z.object({
  uuid: z.string(),
})

export const serviceToken = {
  generate: defineAction({
    input: clientUuidInput,
    handler: async ({ uuid }, request): Promise<ApiResponse<ServiceTokenGenerateData>> => {
      await requirePermission(request, ['admin.full'])
      const token = await requireAuth(request)

      try {
        return await http.post<ServiceTokenGenerateData>(`/clients/${uuid}/token`, token, request, {})
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  delete: defineAction({
    input: clientUuidInput,
    handler: async ({ uuid }, request): Promise<ApiResponse<ServiceTokenDeleteData>> => {
      await requirePermission(request, ['admin.full'])
      const token = await requireAuth(request)

      try {
        return await http.del<ServiceTokenDeleteData>(`/clients/${uuid}/token`, token, request)
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
