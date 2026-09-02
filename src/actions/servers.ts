import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import type { ApiResponse } from '@/types/response'
import { handleApiError, http } from './http'
import type { CheckServer, createServer, DetailsServer } from '@/types/servers'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const servers = {
  register: defineAction({
    accept: 'form',
    input: z.object({
      ip: z.union([z.ipv4(), z.ipv6()]),
      puerto: z.number(),
      name: z.string(),
      username: z.string(),
      password: z.string(),
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
      ip: z.union([z.ipv4({ error: 'La IP no es válida' }), z.ipv6({ error: 'La IP no es válida' })], {
        error: 'La IP es obligatoria',
      }),
      puerto: z.string({ error: 'El puerto es obligatorio' }),
      name: z.string({ error: 'El nombre es obligatorio' }),
      username: z.string(),
      password: z.string(),
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
  check: defineAction({
    input: z.object({
      uuid: z.string(),
    }),
    handler: async ({ uuid }, request) => {
      await requirePermission(request, ['servers.view'])
      const token = await requireAuth(request)

      try {
        const serverInfo = await http.get<CheckServer>(`/servers/${uuid}/health`, token, request)

        return serverInfo
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
