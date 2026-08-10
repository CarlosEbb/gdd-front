export function getComputedColorInHex(cssVarName) {
  // Obtenemos el valor OKLCH nativo procesado por el navegador
  const colorStr = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim()

  if (!colorStr) return null

  // Usar el Canvas para convertir de oklch a RGBA
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = colorStr
  ctx.fillRect(0, 0, 1, 1)

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data

  // Si a es 0 (transparente), significa que el navegador no soporta oklch() en canvas o el color falló.
  if (a === 0 && colorStr.includes('oklch')) {
    // Fallback crudo por si el canvas no soportara OKLCH: usar el color predeterminado
    console.warn('Canvas no soporta OKLCH, usando fallback')
    return null
  }

  // Convertimos a HEX
  const toHex = (c) => c.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
