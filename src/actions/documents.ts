import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { CreateDocument, CreateNewVersion, Document, DocumentVersion, DocumentVersionHistory, GeneratedDocument, RequestForDocument, SchemaFile } from '@/types/documents'
import { requireAuth, requirePermission } from '@/lib/permissions'
import { PAPER_SIZES, ORIENTATION, MARGIN_PRESETS } from '@/constants/file-settings'

export const documents = {
  getByWorkspaces: defineAction({
    input: z.object({
      uuid: z.string(),
    }),
    handler: async ({ uuid }, request) => {
      await requirePermission(request, ['templates.view'])
      const token = await requireAuth(request)

      try {
        const documents = await http.get<Document[]>(`/template/${uuid}`, token, request)

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
      const token = await requireAuth(request)
      const url = limit === null ? '/template' : `/template?limit=${limit}`

      try {
        const documents = await http.get<Document[]>(url, token, request)

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
      pageSize: z.enum(PAPER_SIZES).optional(),
      orientation: z.enum(ORIENTATION).optional(),
      marginType: z.enum(MARGIN_PRESETS).optional(),
      prompt: z.string().optional(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['templates.create'])
      const token = await requireAuth(request)

      try {
        const newDocument = await http.post<CreateDocument>('/template', token, request, input)

        return newDocument
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  createNewVersion: defineAction({
    accept: 'form',
    input: z.object({
      uuid_template: z.string(),
      name_version: z.string().optional(),
      template_data: z.instanceof(File),
    }),
    handler: async ({ uuid_template, name_version, template_data }, request) => {
      await requirePermission(request, ['templates.update'])
      const token = await requireAuth(request)

      const formData = new FormData()
      formData.append('template_data', template_data)
      if (name_version) {
        formData.append('name_version', name_version)
      }

      try {
        const newVersion = await http.post<CreateNewVersion>(`/template/${uuid_template}/version`, token, request, formData)
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
      compress: z.boolean().optional(),
    }),
    handler: async ({ uuid_template, build_number, compress }, request) => {
      await requirePermission(request, ['templates.view'])
      const token = await requireAuth(request)
      const url = `/template/file/${uuid_template}/${build_number}`

      try {
        const file = await http.get<SchemaFile>(url, token, request)
        console.log(file)
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
      await requirePermission(request, ['templates.delete'])
      const token = await requireAuth(request)

      try {
        const deletedDocument = await http.del<void>(`/template/${input.uuid_template}`, token, request, input)
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
      const token = await requireAuth(request)
    },
  }),

  generatePDF: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
    }),
    handler: async ({ uuid_template, build_number }, request) => {
      await requirePermission(request, ['templates.view'])
      const token = await requireAuth(request)
      const url = `/template/generatePDF/${uuid_template}/${build_number}`
      try {
        const pdf = await http.download(url, token, request)

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
      // await requirePermission(request, ['templates.view'], 'all')
      const token = await requireAuth(request)
      const url = `/documents/getTemplate/${uuid_template}`
      try {
        const documents = await http.get<GeneratedDocument[]>(url, token, request)
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
      const token = await requireAuth(request)
      const url = `/documents/variables/${uuid_template}`
      try {
        const response = await http.get<RequestForDocument>(url, token, request)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  createValidationRules: defineAction({
    input: z.object({
      uuid_template: z.string(),
      build_number: z.string(),
      validation_rules: z.record(z.any()),
    }),
    handler: async ({ uuid_template, build_number, validation_rules }, request) => {
      const token = await requireAuth(request)
      const url = `/documents/validate/variables/${uuid_template}/${build_number}`
      try {
        const response = await http.post(url, token, request, validation_rules)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getVersions: defineAction({
    input: z.object({
      uuid_template: z.string(),
    }),
    handler: async ({ uuid_template }, request) => {
      const token = await requireAuth(request)
      const url = `/template/${uuid_template}/versions/user`
      try {
        const response = await http.get<DocumentVersion>(url, token, request)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getHistory: defineAction({
    input: z.object({
      uuid_template: z.string(),
    }),
    handler: async ({ uuid_template }, request) => {
      const token = await requireAuth(request)
      const url = `/template/${uuid_template}/versions/history`
      try {
        const response = await http.get<DocumentVersionHistory[]>(url, token, request)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),
}
