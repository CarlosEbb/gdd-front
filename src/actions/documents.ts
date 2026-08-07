import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type {
  CreateDocument,
  CreateNewVersion,
  Document,
  DocumentVersion,
  DocumentVersionHistory,
  GeneratedDocument,
  RequestForDocument,
  SchemaFile,
  BulkResult,
  BulkStatus,
  BulkUploadResponse,
  BulkFileResponse,
} from '@/types/documents'
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
      uuidBaseTemplate: z.string().optional(),
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
      page: z.number().optional(),
      limit: z.number().optional(),
      status: z.enum(['validation_error', 'success', 'validation_error', 'json_error', 'error']).optional().nullable(),
      searchField: z.string().optional().nullable(),
      searchValue: z.string().optional().nullable(),
    }),
    handler: async ({ uuid_template, page, limit, status, searchField, searchValue }, request) => {
      // await requirePermission(request, ['templates.view'], 'all')
      const token = await requireAuth(request)
      const searchParams = new URLSearchParams({
        page: String(page || 1),
        limit: String(limit || 10),
        status: status || '',
      })
      if (searchField && searchValue) {
        searchParams.append('searchField', searchField)
        searchParams.append('searchValue', searchValue)
      }
      const url = `/documents/getTemplate/${uuid_template}?${searchParams.toString()}`
      console.log(url)
      try {
        const response = await http.get<GeneratedDocument>(url, token, request)
        const documents = response.data
        const mapper = {
          template: documents.template,
          stats: documents.stats,
          pagination: documents.pagination,
          documents: documents.documents.map((doc) => ({
            id: doc.id,
            uuid: doc.uuid,
            id_template: doc.id_template,
            build_number: doc.build_number,
            status: doc.status,
            response_status: doc.response_status,
            response_data: doc.response_data,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            encrypt: doc.encrypt,
            payload: doc.json,
          })),
        }
        return mapper
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

  createValidationRules: defineAction({
    input: z.object({
      uuid_version: z.string(),
      validation_rules: z.record(z.any()),
    }),
    handler: async ({ uuid_version, validation_rules }, request) => {
      const token = await requireAuth(request)
      const url = `/template/versions/${uuid_version}`
      const body = { json: validation_rules }
      try {
        const response = await http.post(url, token, request, body)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  updateMetadata: defineAction({
    input: z.object({
      uuid_version: z.string(),
      title: z.string(),
      description: z.string().optional(),
      name: z.string().optional(),
    }),
    handler: async ({ uuid_version, title, description, name }, request) => {
      await requirePermission(request, ['templates.edit'], 'all')
      const token = await requireAuth(request)
      const url = `/template/${uuid_version}`
      const body = { title, description, name }
      try {
        const response = await http.put(url, token, request, body)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  annulDocument: defineAction({
    input: z.object({
      uuid_template: z.string(),
      uuid_document: z.string(),
      type: z.enum(['WATERMARK', 'DISABLE']),
    }),
    handler: async ({ uuid_template, uuid_document, type }, request) => {
      await requirePermission(request, ['documents.delete'])
      const token = await requireAuth(request)

      const url = `/documents/${uuid_template}/annul/${uuid_document}`
      const body = { type }
      try {
        const response = await http.put(url, token, request, body)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  downloadBulkTemplate: defineAction({
    input: z.object({
      uuid_template: z.string(),
      template_name: z.string().optional(),
    }),
    handler: async ({ uuid_template, template_name }, request) => {
      await requirePermission(request, ['documents.create'])
      const token = await requireAuth(request)
      const url = `/documents/bulk/template/${uuid_template}`
      try {
        const response = await http.download(url, token, request)

        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        return {
          base64: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
          type: 'xlsx',
          filename: `CargaMasiva_${template_name || uuid_template}.xlsx`,
        } as BulkFileResponse
      } catch (error) {
        console.error('❌ Error en downloadBulkTemplate:', error);
        await handleApiError(error, request)
      }
    },
  }),

  uploadBulkDocument: defineAction({
    accept: 'form',
    input: z.object({
      uuid_template: z.string(),
      file: z.instanceof(File),
    }),
    handler: async ({ uuid_template, file }, request) => {
      await requirePermission(request, ['documents.create'])
      const token = await requireAuth(request)
      const url = `/documents/bulk/upload/${uuid_template}`

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await http.post<BulkUploadResponse>(url, token, request, formData, false, true)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  getBulkTaskStatus: defineAction({
    input: z.object({
      jobId: z.string(),
    }),
    handler: async ({ jobId }, request) => {
      await requirePermission(request, ['documents.create'])
      const token = await requireAuth(request)
      const url = `/documents/bulk/status/${jobId}`
      try {
        const response = await http.get<BulkStatus>(url, token, request)
        return response
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),

  downloadBulkReport: defineAction({
    input: z.object({
      jobId: z.string(),
    }),
    handler: async ({ jobId }, request) => {
      await requirePermission(request, ['documents.create'])
      const token = await requireAuth(request)
      const url = `/documents/bulk/report/${jobId}`
      try {
        const response = await http.download(url, token, request)

        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        return {
          base64: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`,
          type: 'xlsx',
          filename: `Reporte_Carga_Masiva_${jobId}.xlsx`,
        } as BulkFileResponse
      } catch (error) {
        await handleApiError(error, request)
      }
    },
  }),
}
