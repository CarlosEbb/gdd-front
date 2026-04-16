import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { DetailsClient } from '@/types/clients'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const clients = {
  list: defineAction({
    handler: async (_, request) => {
      await requirePermission(request, ['clients.view'])
      const token = await requireAuth(request)

      try {
        const clients = await http.get<DetailsClient[]>(`/clients`, token)
        return clients
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
      await requirePermission(request, ['clients.view'])
      const token = await requireAuth(request)

      try {
        const client = await http.get<DetailsClient>(`/clients/${uuid}`, token)
        return client
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  register: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      rif: z.string(),
      logo: z.any().optional(),
      nroWorkspacesMax: z.number().min(1, 'Debe ser mayor a 0'),
      nroDocumentsMax: z.number().min(1, 'Debe ser mayor a 0'),
      serverUuids: z.array(z.string()).min(1, 'Debe seleccionar al menos un servidor'),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['clients.create'])
      const token = await requireAuth(request)

      try {
        const payload = new FormData()
        payload.set('name', input.name)
        payload.set('rif', input.rif)
        payload.set('nroWorkspacesMax', String(input.nroWorkspacesMax))
        payload.set('nroDocumentsMax', String(input.nroDocumentsMax))

        input.serverUuids.forEach((uuid) => {
          payload.append('serverUuids', uuid)
        })

        if (input.logo instanceof File && input.logo.size > 0) {
          payload.set('logo', input.logo)
        }

        const client = await http.post<DetailsClient>(`/clients`, token, payload)

        return client
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
      await requirePermission(request, ['clients.delete'])
      const token = await requireAuth(request)

      try {
        const client = await http.del(`/clients/${uuid}`, token)
        return {
          code: client.code,
          message: client.message,
          data: {
            redirect: '/clients',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  update: defineAction({
    accept: 'form',
    input: z.object({
      uuid: z.string(),
      name: z.string(),
      rif: z.string(),
      logo: z.any().optional(),
      nroWorkspacesMax: z.number().min(1, 'Debe ser mayor a 0'),
      nroDocumentsMax: z.number().min(1, 'Debe ser mayor a 0'),
      serverUuids: z.array(z.string()).min(1, 'Debe seleccionar al menos un servidor'),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['clients.update'])
      const token = await requireAuth(request)

      try {
        const client = await http.put<DetailsClient>(`/clients/${input.uuid}`, token, input)
        return client
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
