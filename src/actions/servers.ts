import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import type { ApiResponse } from '@/types/response'
import { handleApiError, http } from './http'
import type { createServer, DetailsServer } from '@/types/servers'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const servers = {
  register: defineAction({
    accept: 'form',
    input: z.object({
      ip: z.string().ip(),
      puerto: z.number(),
      name: z.string(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['servers.create'])
      const token = await requireAuth(request)

      try {
        const response: ApiResponse<createServer> = await http.post<createServer>(`/servers`, token, request, input)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  list: defineAction({
    handler: async (_, request) => {
      await requirePermission(request, ['servers.view'])
      const token = await requireAuth(request)

      try {
        const servers = await http.get<DetailsServer[]>(`/servers`, token, request)

        return servers
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  getByUuid: defineAction({
    input: z.object({
      uuid: z.string(),
    }),
    handler: async ({ uuid }, request) => {
      await requirePermission(request, ['servers.view'])
      const token = await requireAuth(request)

      try {
        const serverInfo = await http.get<DetailsServer>(`/servers/${uuid}`, token, request)

        return serverInfo
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  updated: defineAction({
    accept: 'form',
    input: z.object({
      uuid: z.string(),
      ip: z.string({ message: 'La IP es obligatoria' }).ip({ message: 'La IP no es válida' }),
      puerto: z.string({ message: 'El puerto es obligatorio' }),
      name: z.string({ message: 'El nombre es obligatorio' }),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['servers.update'])
      const token = await requireAuth(request)

      try {
        const response: ApiResponse<createServer> = await http.put<createServer>(`/servers/${input.uuid}`, token, request, input)
        return response
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  delete: defineAction({
    accept: 'form',
    input: z.object({
      uuid: z.string(),
    }),
    handler: async ({ uuid }, request) => {
      await requirePermission(request, ['servers.delete'])
      const token = await requireAuth(request)

      try {
        const response: ApiResponse<null> = await http.del(`/servers/${uuid}`, token, request)
        return {
          code: response.code,
          message: response.message,
          data: {
            redirect: '/servers',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  getByIp: defineAction({
    input: z.object({
      ip: z.string(),
    }),
    handler: async ({ ip }, request) => {
      await requirePermission(request, ['servers.view'])
      const token = await requireAuth(request)

      try {
        const serverInfo = await http.get<DetailsServer[]>(`/servers/ip/${ip}`, token, request)

        return serverInfo
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
