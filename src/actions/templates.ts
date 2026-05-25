import { defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import type { CreateTemplate, DeleteTemplate, Templates } from '@/types/templates'
import { requirePermission, requireAuth } from '@/lib/permissions'
import { z } from 'astro:schema'

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
  create: defineAction({
    input: z.object({
      category: z.string().default('Mis plantillas'),
      title: z.string(),
      uuidDocument: z.string(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['templates.create'])
      const token = await requireAuth(request)
      try {
        const template = await http.post<CreateTemplate>(`/category/from-document/${input.uuidDocument}`, token, request, input)
        return {
          ...template,
          data: {
            ...template.data,
            redirect: '/templates',
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
      await requirePermission(request, ['templates.delete'])
      const token = await requireAuth(request)

      try {
        const response = await http.del<DeleteTemplate>(`/category/${uuid}`, token, request)
        return {
          ...response,
          data: {
            ...response.data,
            redirect: '/templates',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
