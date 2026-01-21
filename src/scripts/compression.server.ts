/**
 * Utilidades de compresión/descompresión para server-side (Node.js 18+)
 * Usa Web APIs (CompressionStream/DecompressionStream)
 */

/**
 * Comprime un objeto JSON usando gzip y lo convierte a Blob
 * @param data - Objeto a comprimir
 * @returns Blob comprimido con gzip
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
 * Descomprime un ArrayBuffer gzip y lo convierte a objeto JSON
 * @param arrayBuffer - ArrayBuffer comprimido con gzip
 * @returns Objeto JSON descomprimido
 */
export async function decompressJson<T = unknown>(arrayBuffer: ArrayBuffer): Promise<T> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(arrayBuffer))
      controller.close()
    },
  }).pipeThrough(new DecompressionStream('gzip'))

  const text = await new Response(stream).text()
  return JSON.parse(text) as T
}

/**
 * Descomprime un Blob gzip y lo convierte a objeto JSON
 * @param blob - Blob comprimido con gzip
 * @returns Objeto JSON descomprimido
 */
export async function decompressJsonFromBlob<T = unknown>(blob: Blob): Promise<T> {
  const arrayBuffer = await blob.arrayBuffer()
  return decompressJson<T>(arrayBuffer)
}
