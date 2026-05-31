// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/test-utils', '@nuxt/ui', '@nuxthub/core', '@vite-pwa/nuxt', 'nuxt-zod-i18n', '@nuxtjs/i18n'],

  ui: {
    theme: {
      colors: [
        'primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral',
        // Couleurs par classe — alias vers une palette Tailwind dans app.config.ts
        'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
        'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
      ],
    },
  },

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
      // Pas de navigateFallback précaché : l'app est en SSR sans prerender, il n'existe pas
      // d'index.html statique. Les navigations sont gérées en runtime (NetworkFirst) ci-dessous.
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          // Documents (navigations SSR) : une page visitée en ligne se recharge hors-ligne.
          urlPattern: ({ request, url }) =>
            request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          // Fiches de perso + sous-ressources : frais en ligne, dernière version connue hors-ligne.
          urlPattern: ({ url }) => url.pathname.startsWith('/api/character_sheets'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-character',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          // Données de référence (rarement modifiées) : rapide hors-ligne, revalidé en arrière-plan.
          urlPattern: ({ url }) =>
            /^\/api\/(spells|items|backgrounds|classes|magic_schools|invocations|character_species|feats)/.test(url.pathname),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-reference',
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [200] },
          },
        },
      ],
    },
    // SW désactivé en dev par défaut (sinon il met en cache et sert du contenu obsolète pendant
    // le développement). Pour tester l'offline en local : `PWA_DEV=true npm run dev`.
    // La prod génère toujours le service worker (devOptions ne concerne que le dev).
    devOptions: {
      enabled: process.env.PWA_DEV === 'true',
      type: 'module',
      suppressWarnings: true,
    },
  },

  zodI18n: {
    localeCodesMapping: {
      'fr-FR': 'fr',
    },
  },
})
