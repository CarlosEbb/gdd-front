// @ts-check
import { defineConfig, envField } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

import node from '@astrojs/node'

export default defineConfig({
  output: 'server',
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'standalone',
  }),

  env: {
    schema: {
      API_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_PROJECT_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_CARGA_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_NAME_PROJECT: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_TOKEN_EXPIRATION: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_TOKEN_EXPIRATION_SHOW_MODAL: envField.string({ context: 'client', access: 'public' }),
    },
  },
})
