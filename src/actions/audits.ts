import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import { requirePermission, requireAuth } from '@/lib/permissions'

// Helper para armar query params
function buildQueryParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export const audits = {
  getClients: defineAction({
    handler: async (_, request) => {
      await requirePermission(request, ['audit.view'])
      const token = await requireAuth(request)

      try {
        const response = await http.get<any[]>('/audits/clients', token, request)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  getClientLogs: defineAction({
    input: z.object({
      clientUuid: z.string(),
      action: z.string().optional(),
      entity: z.string().optional(),
      userUuid: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['audit.view'])
      const token = await requireAuth(request)

      const { clientUuid, ...filters } = input
      const qs = buildQueryParams(filters)

      try {
        const response = await http.get<any>(`/audits/client/${clientUuid}${qs}`, token, request)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  getGeneralLogs: defineAction({
    input: z.object({
      action: z.string().optional(),
      entity: z.string().optional(),
      clientUuid: z.string().optional(),
      userUuid: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['audit.view'])
      const token = await requireAuth(request)

      const qs = buildQueryParams(input)

      try {
        const response = await http.get<any>(`/audits/general${qs}`, token, request)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  getFilters: defineAction({
    input: z.object({
      clientUuid: z.string().optional(),
    }).optional(),
    handler: async (input, request) => {
      await requirePermission(request, ['audit.view'])
      const token = await requireAuth(request)
      const qs = input?.clientUuid ? `?clientUuid=${input.clientUuid}` : ''

      try {
        const response = await http.get<any>(`/audits/filters${qs}`, token, request)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  purgeLogs: defineAction({
    handler: async (_, request) => {
      // Purgar requiere privilegios de administración completa
      await requirePermission(request, ['admin.full'])
      const token = await requireAuth(request)

      try {
        const response = await http.del<any>('/audits/purge', token, request)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
