import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import type { ApiResponse } from '@/types/response'
import type { AuthResponse } from '@/types/users'
import { handleApiError, http } from './http'

export const auth = {
  login: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async (input, request) => {
      try {
        const info: ApiResponse<AuthResponse> = await http.post<AuthResponse>(
          `/users/login`,
          '',
          {
            email: input.email,
            password: input.password,
          },
          true
        )

        const { user, token } = info.data

        await request.session?.set('token', token)
        await request.session?.set('user', user)

        return {
          code: info.code,
          message: info.message,
          data: {
            redirect: '/home',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  logout: defineAction({
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
        const response = await http.post(`/users/logout`, token, {})

        await request.session?.destroy()
        return {
          code: 200,
          message: 'Sesión cerrada correctamente',
          data: {
            redirect: '/',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),
}
