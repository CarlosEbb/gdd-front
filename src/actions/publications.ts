import { defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import { requirePermission, requireAuth } from '@/lib/permissions'
import { z } from 'astro/zod'
import type { Publication } from '@/types/publications'

export const publications = {
  publish: defineAction({
    input: z.object({
      uuid_template: z.string(),
      uuid_version: z.string(),
    }),
    handler: async (input, request) => {
      // await requirePermission(request, ['templates.view', 'templates.create'])
      const token = await requireAuth(request)
      const url = `/publications/${input.uuid_template}/versions/${input.uuid_version}`
      try {
        const publication = await http.post<Publication>(url, token, request, input)
        return {
          code: publication.code,
          message: publication.message,
          data: {
            redirect: `/config/version/${publication.data.uuid_template}?build_number=${publication.data.version.build_number}`,
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  unpublish: defineAction({
    input: z.object({
      uuid_template: z.string(),
    }),
    handler: async (input, request) => {
      // await requirePermission(request, ['templates.view', 'templates.create'])
      const token = await requireAuth(request)
      const url = `/publications/${input.uuid_template}`
      try {
        const publication = await http.del<Publication>(url, token, request, input)
        return {
          code: publication.code,
          message: publication.message,
          data: [],
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  generatePdf: defineAction({
    input: z.object({
      uuid_template: z.string(),
    }),
    handler: async (input, request) => {
      // await requirePermission(request, ['templates.view', 'templates.create'])
      const token = await requireAuth(request)
      const url = `/publications/${input.uuid_template}/pdf`
      try {
        const publication = await http.get<Publication>(url, token, request)
        return publication
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
