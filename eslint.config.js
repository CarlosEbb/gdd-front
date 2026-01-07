import eslintPluginAstro from 'eslint-plugin-astro'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...eslintPluginAstro.configs.recommended,

  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
      'comma-dangle': ['error', 'only-multiline', 'missing'],
    },
  },
])
