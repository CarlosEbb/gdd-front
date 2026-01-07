import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { handleApiError, http } from './http'
import type { InfoUser } from '@/types/user'

export const user = {
  update: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      last_name: z.string(),
      email: z.string().email(),
      country: z.string().optional(),
      img_profile_file: z.instanceof(File).optional(),
      zip_code: z.string().optional(),
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
        const formData = new FormData()

        formData.append('name', input.name)
        formData.append('last_name', input.last_name)
        formData.append('email', input.email)

        if (input.country) formData.append('country', input.country)
        if (input.zip_code) formData.append('zip_code', input.zip_code)
        if (input.img_profile_file && input.img_profile_file.size > 0) formData.append('img_profile_file', input.img_profile_file)

        const userUpdated = await http.put<InfoUser>(`/auth/updateMyProfile`, token, formData)
        await request.session?.set('user', userUpdated.data as InfoUser)

        return userUpdated
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
