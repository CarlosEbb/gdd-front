import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import type { ApiResponse } from '@/types/response'
import type { User } from '@/types/user'
import { handleApiError, http } from './http'

export const auth = {
  login: defineAction({
    // accept: 'form',
    input: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async (input, request) => {
      try {
        const info: ApiResponse<User> = await http.post<User>(
          `/auth/login`,
          '',
          {
            email: input.email,
            password: input.password,
          },
          true
        )

        const { user, token, workspaces } = info.data

        await request.session?.set('token', token)
        await request.session?.set('user', user)
        await request.session?.set('workspaces', workspaces)

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

  register: defineAction({
    accept: 'form',
    input: z
      .object({
        name: z.string().min(1, 'El nombre es obligatorio'),
        last_name: z.string().min(1, 'El apellido es obligatorio'),
        email: z.string().email('Correo inválido'),
        password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
        confirm_password: z.string(),
        country: z.string().min(1, 'El país es obligatorio'),
        zip_code: z.string().min(1, 'El código postal es obligatorio'),
        // phoneCode: z.string().min(1, 'Código de país requerido'),
        // numberPhone: z.string().min(1, 'Número de teléfono requerido'),
      })
      .refine((data) => data.password === data.confirm_password, {
        message: 'Las contraseñas no coinciden',
        path: ['confirm_password'],
      }),
    handler: async (input, request) => {
      const myHeaders = new Headers()
      myHeaders.append('Content-Type', 'application/json')

      try {
        const register = await http.post<User>(`/auth/register`, '', input, true)

        const { user, token, workspaces } = register.data

        if (register.code === 201) {
          await request.session?.set('user', user)
          await request.session?.set('workspaces', workspaces)
          await request.session?.set('token', token)

          return {
            code: register.code,
            message: register.message,
            data: {
              redirect: '/home',
            },
          }
        }

        return {
          code: register.code,
          message: register.message,
          data: {
            redirect: '/register',
          },
        }
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  resetPassword: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
    }),
    handler: async (input, request) => {
      try {
        const resetPassword = await http.post(`/auth/resetPassword`, '', input, true)

        return resetPassword
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  changePassword: defineAction({
    input: z.object({
      token: z.string(),
      newPassword: z.string(),
    }),
    handler: async (input, request) => {
      try {
        const resetPassword = await http.post(`/auth/changePassword`, '', input, true)

        return resetPassword
      } catch (error) {
        handleApiError(error, request)
      }
    },
  }),

  logout: defineAction({
    handler: async (input, request) => {
      try {
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
