import { getDocumentExtension } from '@/scripts/utils'

/** Alineado con gddV2-back/src/services/documentConversion/config.js (default 20 MB) */
export const DOCUMENT_UPLOAD_MAX_MB = 20
export const DOCUMENT_UPLOAD_MAX_BYTES = DOCUMENT_UPLOAD_MAX_MB * 1024 * 1024

export const DOCUMENT_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const
export type DocumentAllowedExtension = (typeof DOCUMENT_ALLOWED_EXTENSIONS)[number]

export const DOCUMENT_ACCEPT_ATTR = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const SIGNATURES = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d] as const, // %PDF-
  docx: [0x50, 0x4b, 0x03, 0x04] as const,
  doc: [0xd0, 0xcf, 0x11, 0xe0] as const,
} as const

function bufferStartsWith(buffer: Uint8Array, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) return false
  return signature.every((byte, index) => buffer[index] === byte)
}

function detectKindFromBuffer(buffer: Uint8Array): 'pdf' | 'docx' | 'doc' | null {
  if (bufferStartsWith(buffer, SIGNATURES.pdf)) return 'pdf'
  if (bufferStartsWith(buffer, SIGNATURES.docx)) return 'docx'
  if (bufferStartsWith(buffer, SIGNATURES.doc)) return 'doc'
  return null
}

export type DocumentFileValidationResult =
  | { valid: true; extension: DocumentAllowedExtension }
  | { valid: false; message: string }

export async function validateDocumentFile(file: File | undefined | null): Promise<DocumentFileValidationResult> {
  if (!file || file.size === 0) {
    return { valid: false, message: 'El archivo está vacío' }
  }

  if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) {
    return { valid: false, message: 'El archivo excede el tamaño máximo permitido' }
  }

  const extension = getDocumentExtension(file.name)
  if (!DOCUMENT_ALLOWED_EXTENSIONS.includes(extension as DocumentAllowedExtension)) {
    return { valid: false, message: 'Solo se permiten archivos .pdf, .doc o .docx' }
  }

  const headerSize = Math.min(file.size, 8)
  const headerBuffer = new Uint8Array(await file.slice(0, headerSize).arrayBuffer())
  const detectedKind = detectKindFromBuffer(headerBuffer)

  if (!detectedKind) {
    return { valid: false, message: 'El contenido del archivo no coincide con un documento válido' }
  }

  const expectedKind = extension === '.pdf' ? 'pdf' : extension === '.docx' ? 'docx' : 'doc'
  if (detectedKind !== expectedKind) {
    return { valid: false, message: 'La extensión del archivo no coincide con su contenido real' }
  }

  return { valid: true, extension: extension as DocumentAllowedExtension }
}

export function formatDocumentFileSize(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
