// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxthub/core',
    '@vite-pwa/nuxt',
  ],

  pages: true,

  components: [
    {
      path: '~/components/icons',
      pathPrefix: false,
    },
  ],

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

  fonts: {
    experimental: {
      disableLocalFallbacks: true,
    },
    families: [
      {
        name: 'Inknut Antiqua',
        provider: 'local',
        weights: ['400'],
        styles: ['normal'],
      },
      {
        name: 'Playfair',
        provider: 'local',
        weights: ['400'],
        styles: ['normal', 'italic'],
      },
    ],
  },

  pwa: {
    includeAssets: ['favicon.ico'],
    manifest: {
      name: 'Le Bureau du JDR',
      short_name: 'Bureau JDR',
      description: 'Le Bureau du JDR est un site dédié aux jeux de rôle, proposant des ressources, des outils et des informations pour les joueurs et les maîtres de jeu.',
      theme_color: '#6D597A',
    },
  },
})
