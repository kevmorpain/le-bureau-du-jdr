import { describe, it, expect, vi } from 'vitest'

// Comme le loader de Nuxt (@nuxt/kit), qui expose `defineNuxtConfig` en global identité.
vi.stubGlobal('defineNuxtConfig', (config: unknown) => config)
const { default: config } = await import('../../nuxt.config')

describe('routeRules', () => {
  it('/characters/new est rendue côté client : le brouillon du builder est lu en localStorage à l\'init de useState', () => {
    expect(config.routeRules?.['/characters/new']).toEqual({ ssr: false })
  })
})
