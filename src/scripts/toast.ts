import Toastify from 'toastify-js'

export type ToastType = 'info' | 'success' | 'warn' | 'error' | 'loading' | (string & {})

export interface ToastPreset {
  textPrefix?: string
  htmlPrefix?: string
  options?: Toastify.Options
}

type PresetMap = Record<string, ToastPreset>

const defaultOptions: Toastify.Options = {
  gravity: 'bottom',
  position: 'right',
  close: false,
  stopOnFocus: true,
}

const defaultPresets: PresetMap = {
  info: {
    htmlPrefix: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    options: {
      style: { background: '#f5f5f5', color: '#262626', borderRadius: '8px', border: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: '4px' },
      duration: 3500,
    },
  },
  success: {
    htmlPrefix: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    options: {
      style: { background: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '4px' },
      duration: 3500,
    },
  },
  warn: {
    htmlPrefix: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert-icon lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    options: {
      style: { background: '#fef3c7', color: '#d97706', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '4px' },
      duration: 4000,
    },
  },
  error: {
    htmlPrefix: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
    options: {
      style: { background: '#fecaca', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '4px' },
      duration: 5000,
    },
  },
  loading: {
    htmlPrefix: `<svg class="toast-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" style="display: inline-block; margin-right: 8px; vertical-align: middle; animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="32" opacity="0.3"></circle>
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="24"></circle>
    </svg>`,
    options: {
      style: {
        background: '#f5f5f5',
        color: '#262626',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
      },
      // Nota: dejamos sin duración para que sea "persistente" hasta cerrar
      duration: -1,
      close: false,
    },
  },
}

function resolveOptions(type: ToastType, text: string, override?: Partial<Toastify.Options>, presets?: PresetMap): Toastify.Options {
  const preset = (presets || defaultPresets)[type as string]
  let finalText: string
  let escapeMarkup = true

  if (preset?.htmlPrefix) {
    // Si hay HTML prefix, usar HTML y desactivar escape
    finalText = `${preset.htmlPrefix}${text}`
    escapeMarkup = false
  } else if (preset?.textPrefix) {
    // Si hay text prefix, usar texto plano
    finalText = `${preset.textPrefix}${text}`
  } else {
    finalText = text
  }

  return {
    ...defaultOptions,
    ...preset?.options,
    ...override,
    text: finalText,
    escapeMarkup,
  }
}

class Toaster {
  private presets: PresetMap

  constructor(initialPresets?: PresetMap) {
    this.presets = { ...defaultPresets, ...(initialPresets || {}) }
  }

  register(type: ToastType, preset: ToastPreset): void {
    this.presets[type as string] = preset
  }

  show(type: ToastType, text: string, override?: Partial<Toastify.Options>) {
    const opts = resolveOptions(type, text, override, this.presets)
    const instance = Toastify(opts)
    instance.showToast()
    return instance
  }

  info(text: string, override?: Partial<Toastify.Options>) {
    return this.show('info', text, override)
  }

  success(text: string, override?: Partial<Toastify.Options>) {
    return this.show('success', text, override)
  }

  warn(text: string, override?: Partial<Toastify.Options>) {
    return this.show('warn', text, override)
  }

  error(text: string, override?: Partial<Toastify.Options>) {
    return this.show('error', text, override)
  }

  loading(text: string, override?: Partial<Toastify.Options>) {
    return this.show('loading', text, override)
  }
}

export const toaster = new Toaster()

// API de conveniencia
export const toast = {
  show: (type: ToastType, text: string, override?: Partial<Toastify.Options>) => toaster.show(type, text, override),
  info: (text: string, override?: Partial<Toastify.Options>) => toaster.info(text, override),
  success: (text: string, override?: Partial<Toastify.Options>) => toaster.success(text, override),
  warn: (text: string, override?: Partial<Toastify.Options>) => toaster.warn(text, override),
  error: (text: string, override?: Partial<Toastify.Options>) => toaster.error(text, override),
  loading: (text: string, override?: Partial<Toastify.Options>) => toaster.loading(text, override),
  register: (type: ToastType, preset: ToastPreset) => toaster.register(type, preset),
}

export default toast
