import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { CreateDocument, CreateNewVersion, Document, GeneratedDocument, SchemaFile } from '@/types/documents'

export const documents = {
  getByWorkspaces: defineAction({
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
        const documents = await http.get<Document[]>(`/template/${uuid}`, token)

        return documents
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getByUser: defineAction({
    input: z.object({
      limit: z.number().nullable(),
    }),
    handler: async ({ limit }, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const url = limit === null ? '/template' : `/template?limit=${limit}`

      try {
        const documents = await http.get<Document[]>(url, token)

        return documents
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  createTemplate: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string(),
      name: z.string(),
      description: z.string(),
      uuid_workspace: z.string(),
      uuid_category: z.string().optional(),
      prompt: z.string().optional(),
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
        const newDocument = await http.post<CreateDocument>('/template', token, input)

        return newDocument
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  createNewVersion: defineAction({
    input: z.object({
      uuid_template: z.string(),
      name_version: z.string().optional(),
      template_data: z.any(),
    }),
    handler: async ({ uuid_template, name_version, template_data }, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const payload = name_version ? { name_version, template_data } : { template_data }

      try {
        const newVersion = await http.post<CreateNewVersion>(`/template/${uuid_template}/version`, token, payload)
        return newVersion
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getDocument: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
    }),
    handler: async ({ uuid_template, build_number }, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const url = `/template/file/${uuid_template}/${build_number}`

      try {
        const file = await http.get<SchemaFile>(url, token)
        return file
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  deleteDocument: defineAction({
    accept: 'form',
    input: z.object({
      uuid_template: z.string(),
      name_version: z.string(),
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
        const deletedDocument = await http.del<void>(`/template/${input.uuid_template}`, token, input)
        return {
          code: deletedDocument.code,
          message: deletedDocument.message,
          data: {
            redirect: '/documents',
          },
        }
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getDocumentDetails: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
    }),
    handler: async ({ uuid_template, build_number }, request) => {
      const hasToken = await request.session?.has('token')
    },
  }),

  generatePDF: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
    }),
    handler: async ({ uuid_template, build_number }, request) => {
      const hasToken = await request.session?.has('token')
      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const url = `/template/generatePDF/${uuid_template}/${build_number}`
      try {
        const pdf = await http.download(url, token)

        const arrayBuffer = await pdf.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        return {
          base64: `data:application/pdf;base64,${base64}`,
          type: 'pdf',
        }
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getListGeneratedDocuments: defineAction({
    input: z.object({
      uuid_template: z.string(),
    }),
    handler: async ({ uuid_template }, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const url = `/documents/getTemplate/${uuid_template}`
      try {
        const documents = await http.get<GeneratedDocument[]>(url, token)
        return documents
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getRequestForDocument: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
    }),
    handler: async ({ uuid_template, build_number }, request) => {
      const hasToken = await request.session?.has('token')

      if (!hasToken) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No autorizado. Inicia sesión de nuevo.',
        })
      }

      const token = (await request.session?.get('token')) as string
      const url = `/documents/variables/${uuid_template}/${build_number}`
      try {
        const request = await http.get<Request>(url, token)
        return request
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),
}
