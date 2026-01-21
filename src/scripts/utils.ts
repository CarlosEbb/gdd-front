export function base64ToBlob(base64: string): Blob {
  const byteString = atob(base64.split(',')[1])
  const mimeType = base64.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}

export function getQueryParam(paramName: string): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  const paramValue = urlParams.get(paramName)
  return paramValue
}

export function setCookie({ name, value, days = 30 }: { name: string; value: string; days: number }) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=${new Date(0).toUTCString()}; path=/`
}

/**
 * Convierte una fecha ISO (UTC) a un formato español personalizado
 * usando la API Intl.DateTimeFormat.formatToParts().
 * * @param isoString La fecha en formato ISO (ej: "2025-11-04T15:45:54.868Z")
 * @returns La fecha formateada (ej: "Mar, 4 noviembre 2025")
 */
export function formatISODateWithIntl(isoString: string): string {
  const date = new Date(isoString)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short', // "lun", "mar", "mié"
    day: 'numeric', // "4", "20"
    month: 'long', // "noviembre", "octubre"
    year: 'numeric', // "2025"
    timeZone: 'UTC',
  }

  const formatter = new Intl.DateTimeFormat('es', options)
  const parts = formatter.formatToParts(date)
  const partMap = new Map(parts.map((part) => [part.type, part.value]))

  const weekday = partMap.get('weekday') || ''
  const day = partMap.get('day') || ''
  const month = partMap.get('month') || ''
  const year = partMap.get('year') || ''

  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)

  return `${capitalizedWeekday}, ${day} ${month} ${year}`
}

/**
 * Convierte una fecha ISO (UTC) a un formato español personalizado
 * usando la API Intl.DateTimeFormat.formatToParts().
 * * @param isoString La fecha en formato ISO (ej: "2025-11-04T15:45:54.868Z")
 * @returns La fecha formateada (ej: "4 noviembre 2025")
 */
export function formatDate(isoString: string): string {
  if (!isoString) return ''
  const [datePart] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const formatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return formatter.format(Date.UTC(year, month - 1, day))
}

/**
 * Opciones para configurar el estado de loading del botón
 */
export interface ButtonLoadingOptions {
  loadingText?: string
}

/**
 * Activa o desactiva el estado de loading de un botón
 * @param selector - Selector CSS del botón o elemento HTMLButtonElement
 * @param loading - true para activar loading, false para desactivar
 * @param options - Opciones adicionales como loadingText
 *
 * @example
 * // Activar loading con selector CSS
 * setButtonLoading('#submit-btn', true)
 *
 * @example
 * // Desactivar loading con elemento
 * const button = document.querySelector('#submit-btn')
 * setButtonLoading(button, false)
 *
 * @example
 * // Activar loading con texto personalizado
 * setButtonLoading('#submit-btn', true, { loadingText: 'Procesando...' })
 */
export function setButtonLoading(selector: string | HTMLButtonElement, loading: boolean, options?: ButtonLoadingOptions): void {
  let button: HTMLButtonElement | null

  if (typeof selector === 'string') {
    button = document.querySelector(selector)
  } else {
    button = selector
  }

  if (!button) {
    console.warn(`Button not found: ${selector}`)
    return
  }

  const spinner = button.querySelector('[data-button-spinner]') as HTMLElement
  const content = button.querySelector('[data-button-content]') as HTMLElement

  if (!spinner || !content) {
    console.warn(`Button spinner or content not found in: ${selector}`)
    return
  }

  // Si se proporciona loadingText, actualizar el atributo data
  if (options?.loadingText) {
    button.setAttribute('data-loading-text', options.loadingText)
  }

  // Guardar contenido original si no existe
  if (!button.hasAttribute('data-original-content')) {
    button.setAttribute('data-original-content', content.innerHTML)
  }

  const originalContent = button.getAttribute('data-original-content') || ''
  const loadingText = button.dataset.loadingText
  const showTextOnLoading = button.dataset.showTextOnLoading !== 'false'

  if (loading) {
    // Activar estado de loading
    button.setAttribute('data-loading', 'true')
    button.disabled = true
    spinner.classList.remove('hidden')

    if (loadingText) {
      content.textContent = loadingText
    } else if (!showTextOnLoading) {
      content.classList.add('hidden')
    }
  } else {
    // Desactivar estado de loading
    button.removeAttribute('data-loading')
    button.disabled = false
    spinner.classList.add('hidden')

    if (loadingText || !showTextOnLoading) {
      content.innerHTML = originalContent
      content.classList.remove('hidden')
    }
  }
}

export const getTokenAndEmailForUrl = () => {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('token') as string
  const email = url.searchParams.get('email') as string
  return { token, email }
}

/**
 * Wrapper para llamar Astro Actions desde el cliente
 * Maneja automáticamente errores de token expirado (UNAUTHORIZED)
 * y redirige al usuario a la página de login
 *
 * @param actionFn - Promesa resultante de llamar a una Astro Action
 * @returns El resultado de la action con garantía de tipo: si no hay error, data está definido
 *
 * @example
 * const { data, error } = await callAction(actions.workspaces.create(dataForm))
 * if (error) {
 *   // manejar error
 *   return
 * }
 * // TypeScript sabe que data está definido aquí
 * console.log(data.message)
 */
export async function callAction<T>(
  actionFn: Promise<{ data?: T; error?: { code: string; message: string } }>
): Promise<{ data: T; error: undefined } | { data: undefined; error: { code: string; message: string } }> {
  const result = await actionFn

  if (result.error?.code === 'UNAUTHORIZED') {
    window.location.href = '/inactivity'
    // Retornar con el error para que el código pueda manejarlo si es necesario
    return { data: undefined, error: result.error }
  }

  // Si hay error, retornar con data undefined
  if (result.error) {
    return { data: undefined, error: result.error }
  }

  // Si no hay error, data está garantizado que existe
  return { data: result.data as T, error: undefined }
}

/**
 * Valida el tamaño de la imagen
 * @param file - Archivo de imagen
 * @returns true si el tamaño es mayor a 5MB, false en caso contrario
 */
export const validateSizeImage = (file: File) => {
  return file.size > 5 * 1024 * 1024
}

/**
 * Valida el tipo de la imagen
 * @param file - Archivo de imagen
 * @returns true si el tipo es válido, false en caso contrario
 */
export const validateTypeImage = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
  return !validTypes.includes(file.type)
}

/**
 * Valida la imagen
 * @param file - Archivo de imagen
 * @returns { valid: boolean; messages: string } si la imagen es válida, false en caso contrario
 * @example
 * const { valid, messages } = validateImage(file)
 * if (!valid) {
 *   console.log(messages)
 * }
 * else {
 *   console.log('La imagen es válida')
 * }
 */
export const validateImage = (file: File): { valid: boolean; messages: string } => {
  let messages = ''

  if (!file || file.size === 0) {
    messages = 'La imagen es requerida'
    return { valid: false, messages }
  }
  if (validateSizeImage(file)) {
    messages = 'El tamaño de la imagen no debe ser mayor a 5MB'
    return { valid: false, messages }
  }
  if (validateTypeImage(file)) {
    messages = 'El tipo de imagen no es válido'
    return { valid: false, messages }
  }
  return { valid: true, messages }
}

/**
 * Comprime un objeto JSON usando gzip y lo convierte a Blob
 * @param data - Objeto a comprimir
 * @returns Blob comprimido con gzip
 * @example
 * const blob = await compressJson(templateData)
 * formData.append('template_data', blob, 'template.json.gz')
 */
export async function compressJson(data: unknown): Promise<Blob> {
  const jsonString = JSON.stringify(data)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(jsonString))
      controller.close()
    },
  })
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
  return await new Response(compressedStream).blob()
}

/**
 * Descomprime un Blob gzip y lo convierte a objeto JSON
 * @param blob - Blob comprimido con gzip
 * @returns Objeto JSON descomprimido
 * @example
 * const data = await decompressJson(compressedBlob)
 */
export async function decompressJson<T = unknown>(blob: Blob): Promise<T> {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  const decompressedText = await new Response(stream).text()
  return JSON.parse(decompressedText) as T
}
