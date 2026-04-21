export const PAPER_SIZES = ['CARTA', 'LEGAL', 'INFORME', 'EJECUTIVO', 'A5', 'B5', 'A4', 'FICHA'] as const

export const MARGIN_PRESETS = ['NONE', 'NORMAL', 'ESTRECHO', 'MODERADO', 'ANCHO'] as const

export const ORIENTATION = ['PORTRAIT', 'LANDSCAPE'] as const

export const PAPER_SIZES_MAP = {
  CARTA: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
  INFORME: { width: 139.7, height: 215.9 },
  EJECUTIVO: { width: 184.2, height: 266.7 },
  A5: { width: 148, height: 210 },
  B5: { width: 182, height: 257 },
  A4: { width: 210, height: 297 },
  FICHA: { width: 76.2, height: 127 },
}

// Definir márgenes predefinidos
export const MARGIN_PRESETS_MAP = {
  NONE: { top: 0, bottom: 0, left: 0, right: 0 },
  NORMAL: { top: 25, bottom: 25, left: 30, right: 30 }, // 2.5cm, 2.5cm, 3cm, 3cm
  ESTRECHO: { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7 }, // 1.27cm
  MODERADO: { top: 25.4, bottom: 25.4, left: 19.1, right: 19.1 }, // 2.54cm, 2.54cm, 1.91cm, 1.91cm
  ANCHO: { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8 }, // 2.54cm, 2.54cm, 5.08cm, 5.08cm
}

/** Formatea milímetros a centímetros con coma decimal (es-ES) y hasta 2 decimales */
export function formatMmToCm(mm: number): string {
  return (mm / 10).toLocaleString('es-ES', { maximumFractionDigits: 2 })
}

/** Devuelve la etiqueta del tamaño de papel con sus medidas en cm. Ej: "CARTA (21,59 cm x 27,94 cm)" */
export function formatPaperSizeLabel(name: keyof typeof PAPER_SIZES_MAP): string {
  const { width, height } = PAPER_SIZES_MAP[name]
  return `${name} (${formatMmToCm(width)} cm x ${formatMmToCm(height)} cm)`
}

/**
 * Devuelve la etiqueta del margen con sus medidas en cm.
 * - Todos iguales → "ESTRECHO (1,27 cm)"
 * - Simétrico (top=bottom, left=right) → "NORMAL (2,5 x 3 cm)"
 * - Asimétrico → "X (t / r / b / l cm)"
 */
export function formatMarginLabel(name: keyof typeof MARGIN_PRESETS_MAP): string {
  const m = MARGIN_PRESETS_MAP[name]
  const allEqual = m.top === m.bottom && m.top === m.left && m.top === m.right
  if (allEqual) return `${name} (${formatMmToCm(m.top)} cm)`

  const verticalSame = m.top === m.bottom
  const horizontalSame = m.left === m.right
  if (verticalSame && horizontalSame) {
    return `${name} (${formatMmToCm(m.top)} cm x ${formatMmToCm(m.left)} cm)`
  }
  return `${name} (${formatMmToCm(m.top)} / ${formatMmToCm(m.right)} / ${formatMmToCm(m.bottom)} / ${formatMmToCm(m.left)} cm)`
}

/** Etiquetas precomputadas para usar directamente en los <option> del select */
export const PAPER_SIZE_LABELS: Record<(typeof PAPER_SIZES)[number], string> = PAPER_SIZES.reduce(
  (acc, name) => {
    acc[name] = formatPaperSizeLabel(name)
    return acc
  },
  {} as Record<(typeof PAPER_SIZES)[number], string>
)

export const MARGIN_PRESET_LABELS: Record<(typeof MARGIN_PRESETS)[number], string> = MARGIN_PRESETS.reduce(
  (acc, name) => {
    acc[name] = formatMarginLabel(name)
    return acc
  },
  {} as Record<(typeof MARGIN_PRESETS)[number], string>
)
