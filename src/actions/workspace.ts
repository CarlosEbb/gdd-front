import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { AssignUser, DetailsWorkspace, NewWorkspace, WorkspaceByUser } from '@/types/workspaces'

export const workspaces = {
  create: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      icon: z.string(),
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
        const newWorkspace = await http.post<NewWorkspace>('/workspace', token, {
          name: input.name,
          icon: input.icon,
        })

        workspaces.push(newWorkspace.data)
        await request.session?.set('workspaces', workspaces)

        return newWorkspace
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  getById: defineAction({
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
        const newWorkspace = await http.get<DetailsWorkspace>(`/workspace/${uuid}`, token)

        return newWorkspace
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  getByUser: defineAction({
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
        const workspacesByUser = await http.get<WorkspaceByUser[]>(`/workspace/${uuid}/users`, token)

        return workspacesByUser
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  assignUser: defineAction({
    input: z.object({
      uuid: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ uuid, email }, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const assignUser = await http.post<AssignUser[]>(`/workspace/${uuid}/assign`, token, {
          targetUserEmail: email,
        })

        return assignUser
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  unassignUser: defineAction({
    input: z.object({
      uuid: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ uuid, email }, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const unassignUser = await http.del<void>(`/workspace/${uuid}/remove-user`, token, {
          targetUserEmail: email,
        })

        return unassignUser
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
    }),
    handler: async ({ uuid, name, icon }, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string

      try {
        const updatedWorkspace = await http.put<NewWorkspace>(`/workspace/${uuid}`, token, {
          name,
          icon,
        })
        const workspaces = (await request.session?.get('workspaces')) || []
        const updatedWorkspaces = workspaces.map((workspace) => (workspace.uuid === uuid ? { ...workspace, name, icon } : workspace))
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
        const deletedWorkspace = await http.del<void>(`/workspace/${uuid}`, token)

        const workspaces = (await request.session?.get('workspaces')) || []
        const updatedWorkspaces = workspaces.filter((workspace) => workspace.uuid !== uuid)
        await request.session?.set('workspaces', updatedWorkspaces)

        return {
          code: deletedWorkspace.code,
          message: deletedWorkspace.message,
          data: {
            redirect: '/home',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
