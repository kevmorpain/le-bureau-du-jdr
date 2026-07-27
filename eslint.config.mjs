// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: true,
  },
})
  .append({
    rules: {
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'vue/no-multiple-template-root': ['off'],
    },
  })
