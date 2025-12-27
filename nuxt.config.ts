// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/test-utils', '@nuxt/ui', '@nuxthub/core', '@vite-pwa/nuxt', 'nuxt-zod-i18n', '@nuxtjs/i18n'],

  pages: true,

  components: [
    {
      path: '~/components',
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

  compatibilityDate: '2025-12-27',

  // to seed database
  nitro: {
    experimental: {
      tasks: true,
    },
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  hub: {
    db: 'sqlite',
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

  i18n: {
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', name: 'Français', file: 'fr.json' },
    ],
  },

  pwa: {
    strategies: 'generateSW',
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico'],
    manifest: {
      name: 'Le Bureau du JDR',
      short_name: 'Bureau JDR',
      description: 'Le Bureau du JDR est un site dédié aux jeux de rôle, proposant des ressources, des outils et des informations pour les joueurs et les maîtres de jeu.',
      theme_color: '#FFB900',
      icons: [
        {
          src: '/img/icons/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/img/icons/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
  },

  zodI18n: {
    localeCodesMapping: {
      'fr-FR': 'fr',
    },
  },
})
