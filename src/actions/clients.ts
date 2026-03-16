import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { DetailsClient } from '@/types/clients'

export const clients = {
  list: defineAction({
    handler: async (_, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

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
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

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
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const client = await http.post<DetailsClient>(`/clients`, token, {
          name: input.name,
          rif: input.rif,
          logo: input.logo,
          nroWorkspacesMax: input.nroWorkspacesMax,
          nroDocumentsMax: input.nroDocumentsMax,
          serverUuids: input.serverUuids,
        })

        return client
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
