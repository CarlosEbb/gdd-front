import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { handleApiError, http } from './http'
import type { InfoProfile } from '@/types/profile'
import { requireAuth } from '@/lib/permissions'
import type { Details } from '@/types/users'

export const profile = {
  update: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      lastName: z.string(),
      email: z.email(),
      country: z.string().optional(),
      img_profile_file: z.any().optional(),
      zipCode: z.string().optional(),
    }),
    handler: async (input, request) => {
      const token = await requireAuth(request)

      try {
        const formData = new FormData()

        formData.append('name', input.name)
        formData.append('lastName', input.lastName)
        formData.append('email', input.email)

        if (input.country) formData.append('country', input.country)
        if (input.zipCode) formData.append('zipCode', input.zipCode)
        if (input.img_profile_file && input.img_profile_file.size > 0) formData.append('img_profile_file', input.img_profile_file)

        const userUpdated = await http.put<InfoProfile>('/users/profile', token, request, formData)
        await request.session?.set('user', userUpdated.data as Details)

        return userUpdated
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
