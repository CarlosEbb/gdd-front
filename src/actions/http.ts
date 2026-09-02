import type { ApiResponse } from '@/types/response'
import { ActionError } from 'astro:actions'
import type { ActionAPIContext } from 'astro:actions'
import { API_URL, PUBLIC_CARGA_URL } from 'astro:env/client'

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token: string
  body?: unknown
  isPublic?: boolean
  ctx?: ActionAPIContext
  useCargaUrl?: boolean
}

export class ApiError extends Error {
  public readonly code: number
  public readonly _isApiError = true as const

  constructor(message: string, code: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export class UnauthorizedError extends ApiError {
  public readonly _isUnauthorizedError = true as const

  constructor(message: string) {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return typeof error === 'object' && error !== null && '_isUnauthorizedError' in error
}

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && '_isApiError' in error
}

/** Bulk usa PUBLIC_CARGA_URL; el resto de la API usa API_URL */
function resolveBaseUrl(useCargaUrl = false): string {
  const baseUrl = useCargaUrl ? PUBLIC_CARGA_URL : API_URL
  const envName = useCargaUrl ? 'PUBLIC_CARGA_URL' : 'API_URL'

  if (!baseUrl) {
    throw new Error(`La variable de entorno ${envName} no está configurada. Configúrala en tu entorno.`)
  }

  return baseUrl
}

async function apiFetch<T>(endpoint: string, options: ApiFetchOptions, isPublic: boolean = false): Promise<ApiResponse<T>> {
  const baseUrl = resolveBaseUrl(options.useCargaUrl)
  const url = `${baseUrl}${endpoint}`

  const headers = new Headers()
  const authorization = isPublic ? '' : `Bearer ${options.token}`
  headers.set('Authorization', authorization)

  if (!isPublic && options.ctx) {
    try {
      const clientIp = options.ctx.clientAddress
      if (clientIp) {
        headers.set('x-client-ip', clientIp)
      }
    } catch {
      // clientAddress no está disponible en páginas prerenderizadas, se ignora
    }
  }

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

async function apiFetchBlob(endpoint: string, token: string, ctx?: ActionAPIContext, method: 'GET' | 'POST' = 'GET'): Promise<Blob> {
  const baseUrl = resolveBaseUrl(true)
  const url = `${baseUrl}${endpoint}`

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  if (ctx) {
    try {
      const clientIp = ctx.clientAddress
      if (clientIp) {
        headers.set('x-client-ip', clientIp)
      }
    } catch {
      // clientAddress no disponible en páginas prerenderizadas
    }
  }

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
    
    let errorMessage = 'Error al descargar el archivo'
    try {
      // Intentar leer la respuesta como JSON para extraer el mensaje de la API
      const errorData = await response.clone().json()
      if (errorData && errorData.message) {
        errorMessage = errorData.message
      }
    } catch (e) {
      // Si no es JSON o falla, mantener el mensaje genérico
    }
    
    throw new ApiError(errorMessage, response.status)
  }

  return await response.blob()
}

export const http = {
  get: <T>(endpoint: string, token: string, ctx: ActionAPIContext, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'GET', token, ctx }, isPublic)
  },

  post: <T>(
    endpoint: string,
    token: string,
    ctx: ActionAPIContext,
    body: unknown,
    isPublic: boolean = false,
    useCargaUrl: boolean = false,
  ): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'POST', token, ctx, body, useCargaUrl }, isPublic)
  },

  put: <T>(endpoint: string, token: string, ctx: ActionAPIContext, body: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'PUT', token, ctx, body }, isPublic)
  },

  del: <T>(endpoint: string, token: string, ctx: ActionAPIContext, body?: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'DELETE', token, ctx, body }, isPublic)
  },

  download: (endpoint: string, token: string, ctx: ActionAPIContext, method: 'GET' | 'POST' = 'GET'): Promise<Blob> => {
    return apiFetchBlob(endpoint, token, ctx, method)
  },

  patch: <T>(endpoint: string, token: string, ctx: ActionAPIContext, body: unknown, isPublic: boolean = false): Promise<ApiResponse<T>> => {
    return apiFetch<T>(endpoint, { method: 'PATCH', token, ctx, body }, isPublic)
  },
}

export function handleApiError(error: unknown, request: ActionAPIContext): never {
  // Token expirado o no autorizado
  if (isUnauthorizedError(error)) {
    console.error(`Token expirado o no autorizado (${error.code}): ${error.message}`)
    request.session?.destroy()
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: error.message,
    })
  }

  // Otros errores de API
  if (isApiError(error)) {
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
