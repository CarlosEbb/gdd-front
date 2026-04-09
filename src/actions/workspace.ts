import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { Workspace } from '@/types/workspaces'

export const workspaces = {
  create: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      icon: z.string(),
      clientUuid: z.string(),
      serverUuid: z.string(),
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
      const workspaces = (await request.session?.get('workspaces')) || []

      try {
        const newWorkspace = await http.post<Workspace>('/workspaces', token, {
          name: input.name,
          icon: input.icon,
          clientUuid: input.clientUuid,
          serverUuid: input.serverUuid,
        })

        workspaces.push(newWorkspace.data)
        await request.session?.set('workspaces', workspaces)

        return newWorkspace
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

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
        const workspaces = await http.get<Workspace[]>('/workspaces', token)
        await request.session?.set('workspaces', workspaces.data)
        return workspaces
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
        const workspace = await http.get<Workspace>(`/workspaces/${uuid}`, token)

        return workspace
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  update: defineAction({
    input: z.object({
      uuid: z.string(),
      name: z.string(),
      icon: z.string(),
      clientUuid: z.string(),
      serverUuid: z.string(),
    }),
    handler: async ({ uuid, name, icon, clientUuid, serverUuid }, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const updatedWorkspace = await http.put<Workspace>(`/workspaces/${uuid}`, token, {
          name,
          icon,
          clientUuid,
          serverUuid,
        })
        const workspaces = (await request.session?.get('workspaces')) || []
        const updatedWorkspaces = workspaces.map((workspace) => (workspace.uuid === uuid ? { ...workspace, name, icon, clientUuid, serverUuid } : workspace))
        await request.session?.set('workspaces', updatedWorkspaces)

        return {
          code: updatedWorkspace.code,
          message: updatedWorkspace.message,
          data: {
            redirect: `/workspaces/${uuid}`,
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  delete: defineAction({
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
        const deletedWorkspace = await http.del<void>(`/workspaces/${uuid}`, token)

        const workspaces = (await request.session?.get('workspaces')) || []
        const updatedWorkspaces = workspaces.filter((workspace) => workspace.uuid !== uuid)
        await request.session?.set('workspaces', updatedWorkspaces)

        return {
          code: deletedWorkspace.code,
          message: deletedWorkspace.message,
          data: {
            redirect: '/workspaces',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
