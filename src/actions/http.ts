import type { ApiResponse } from '@/types/response'
import { ActionError } from 'astro:actions'
import type { ActionAPIContext } from 'astro:actions'

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token: string
  body?: unknown
  isPublic?: boolean
}

export class ApiError extends Error {
  public readonly code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

async function apiFetch<T>(endpoint: string, options: ApiFetchOptions, isPublic: boolean = false): Promise<ApiResponse<T>> {
  const API_PROJECT_URL = import.meta.env.API_URL ?? (globalThis as any).process?.env?.API_URL

  if (!API_PROJECT_URL) {
    throw new Error('La variable de entorno API_URL no está configurada. Configúrala en tu entorno.')
  }

  const url = `${API_PROJECT_URL}${endpoint}`

  const headers = new Headers()
  const authorization = isPublic ? '' : `Bearer ${options.token}`
  headers.set('Authorization', authorization)

  const isFormData = options.body instanceof FormData
  let requestBody: BodyInit | undefined

  if (options.body) {
    if (isFormData) {
      requestBody = options.body as FormData
    } else {
      headers.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(options.body)
    }
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers: headers,
    body: requestBody,
  }

  let response: Response

  // Capturar errores de red
  try {
    response = await fetch(url, config)
  } catch (networkError) {
    console.error('Error de red en apiFetch:', networkError)
    throw new Error(`Error de conexión: ${(networkError as Error).message}`)
  }

  // Respuestas vacías
  if (response.status === 204) {
    return {
      code: response.status,
      message: '',
      data: {} as T,
    }
  }

  let result: ApiResponse<T>

  // Respuestas que no son JSON
  try {
    result = await response.json()
  } catch (jsonError) {
    console.error('Error al parsear JSON:', jsonError)
    throw new Error(`Respuesta inválida del servidor`)
  }

  // Error personalizado si la API devuelve un error
  if (!response.ok || result.code >= 400) {
    const errorCode = result.code || response.status
    const errorMessage = result.message || 'Error desconocido de API'

    // Token expirado o no autorizado
    if (errorCode === 401) {
      throw new UnauthorizedError(errorMessage)
    }

    throw new ApiError(errorMessage, errorCode)
  }

  return result
}

async function apiFetchBlob(endpoint: string, token: string, method: 'GET' | 'POST' = 'GET'): Promise<Blob> {
  const API_PROJECT_URL = import.meta.env.API_URL ?? (globalThis as any).process?.env?.API_URL

  if (!API_PROJECT_URL) {
    throw new Error('La variable de entorno API_URL no está configurada. Configúrala en tu entorno.')
  }

  const url = `${API_PROJECT_URL}${endpoint}`

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  const config: RequestInit = {
    method,
    headers,
  }

  let response: Response

  try {
    response = await fetch(url, config)
  } catch (networkError) {
    console.error('Error de red en apiFetchBlob:', networkError)
    throw new Error(`Error de conexión: ${(networkError as Error).message}`)
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new UnauthorizedError('No autorizado')
    }
    throw new ApiError('Error al descargar el archivo', response.status)
  }

  return await response.blob()
}

export const http = {
  get: <T>(endpoint: string, token: string, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'GET', token }, isPublic)
  },

  post: <T>(endpoint: string, token: string, body: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'POST', token, body }, isPublic)
  },

  put: <T>(endpoint: string, token: string, body: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'PUT', token, body }, isPublic)
  },

  del: <T>(endpoint: string, token: string, body?: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'DELETE', token, body }, isPublic)
  },

  download: (endpoint: string, token: string, method: 'GET' | 'POST' = 'GET'): Promise<Blob> => {
    return apiFetchBlob(endpoint, token, method)
  },
}

export function handleApiError(error: unknown, request: ActionAPIContext): never {
  // Token expirado o no autorizado
  if (error instanceof UnauthorizedError) {
    console.error(`Token expirado o no autorizado (${error.code}): ${error.message}`)
    request.session?.destroy()
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: error.message,
    })
  }

  // Otros errores de API
  if (error instanceof ApiError) {
    console.error(`Error de API (${error.code}): ${error.message}`)
    throw new ActionError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    })
  }

  // Errores inesperados
  console.error('Error inesperado en acción:', error)
  throw new ActionError({
    code: 'INTERNAL_SERVER_ERROR',
    message: (error as Error).message || 'Ocurrió un error inesperado.',
  })
}
