import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import { Status, type Details, type GetUserByUuidResponse } from '@/types/users'
import { requirePermission, requireAuth } from '@/lib/permissions'

export const users = {
  list: defineAction({
    handler: async (_, request) => {
      await requirePermission(request, ['users.view'])
      const token = await requireAuth(request)

      try {
        const users = await http.get<Details[]>(`/users`, token)

        return users
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  register: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      password: z.string(),
      country: z.string(),
      zipCode: z.string(),
      'clientUuids[]': z.array(z.string()).optional().default([]),
      'permissionUuids[]': z.array(z.string()).optional().default([]),
      img_profile_file: z.any().optional(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['users.create'])
      const token = await requireAuth(request)

      try {
        const formData = new FormData()
        Object.entries(input).forEach(([key, value]) => {
          if (key === 'img_profile_file') {
            if (value && value.size > 0) formData.append(key, value)
          } else if (Array.isArray(value)) {
            // Los campos ya vienen con [] en el nombre, así que usamos el key directamente
            value.forEach((v) => formData.append(key, v))
          } else {
            formData.append(key, value)
          }
        })

        const userCreated = await http.post<Details>(`/users/register`, token, formData)
        return userCreated
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
      lastName: z.string(),
      email: z.string().email(),
      country: z.string().optional(),
      img_profile_file: z.any().optional(),
      zipCode: z.string().optional(),
    }),
    handler: async (input, request) => {
      await requirePermission(request, ['users.update'])
      const token = await requireAuth(request)

      try {
        const formData = new FormData()
        formData.append('name', input.name)
        formData.append('lastName', input.lastName)
        formData.append('email', input.email)
        if (input.country) formData.append('country', input.country)
        if (input.zipCode) formData.append('zipCode', input.zipCode)
        if (input.img_profile_file && input.img_profile_file.size > 0) formData.append('img_profile_file', input.img_profile_file)

        const userUpdated = await http.put<Details>(`/users/${input.uuid}`, token, formData)

        await request.session?.set('user', userUpdated.data)

        return userUpdated
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
      await requirePermission(request, ['users.delete'])
      const token = await requireAuth(request)

      try {
        const response = await http.del(`/users/${uuid}`, token)
        return {
          code: response.code,
          message: response.message,
          data: {
            redirect: '/users',
          },
        }
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
      await requirePermission(request, ['users.view'])
      const token = await requireAuth(request)

      try {
        const user = await http.get<GetUserByUuidResponse>(`/users/${uuid}`, token)

        return user
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
  updateStatus: defineAction({
    accept: 'form',
    input: z.object({
      uuid: z.string(),
      status: z.enum(Object.values(Status) as [string, ...string[]]),
    }),
    handler: async ({ uuid, status }, request) => {
      await requirePermission(request, ['users.update'])
      const token = await requireAuth(request)

      try {
        const user = await http.patch<Details>(`/users/${uuid}/status`, token, { status })
        return user
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
