import { defineAction } from 'astro:actions'
import { handleApiError, http } from './http'
import { requirePermission, requireAuth } from '@/lib/permissions'
import type { Metrics, MetricsByDocument } from '@/types/metrics'
import { z } from 'astro/zod'

export const metrics = {
  getGeneral: defineAction({
    handler: async (_, request) => {
      // await requirePermission(request, ['admin.'])
      const token = await requireAuth(request)

      try {
        const metrics = await http.get<Metrics>('/metrics/general', token, request)
        return metrics
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  getMetricsByDocument: defineAction({
    input: z.object({
      uuid_template: z.string(),
      days: z.number(),
    }),
    handler: async ({ uuid_template, days }, request) => {
      // await requirePermission(request, ['admin.'])
      const token = await requireAuth(request)

      try {
        const metrics = await http.get<MetricsByDocument>(`/documents/metrics/${uuid_template}/${days}`, token, request)
        return metrics
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
