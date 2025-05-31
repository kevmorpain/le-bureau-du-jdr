// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxthub/core'
  ],

  pages: true,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Le Bureau du JDR',
    },
  },
  css: ['~/assets/css/main.css'],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  // to seed database
  nitro: {
    experimental: {
      tasks: true,
    },
  },

  hub: {
    workers: true,
    database: true,
  },
})
