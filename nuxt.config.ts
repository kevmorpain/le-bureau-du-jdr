// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/test-utils', '@nuxt/ui', '@nuxthub/core', '@vite-pwa/nuxt', 'nuxt-zod-i18n', '@nuxtjs/i18n', 'nuxt-auth-utils'],

  // Session scellée (nuxt-auth-utils). maxAge long pour survivre au mode hors-ligne :
  // la file de synchro rejoue les mutations tant que le cookie est valide.
  // Secrets attendus en env : NUXT_SESSION_PASSWORD (≥32 car.),
  // NUXT_OAUTH_DISCORD_CLIENT_ID/SECRET, NUXT_OAUTH_GOOGLE_CLIENT_ID/SECRET.
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    },
  },

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

  // Cache edge du catalogue (lot 6a). Le catalogue est STATIQUE (un seul `ruleset` en Phase 1 ;
  // le discriminant = Phase 2) et ne change qu'à un (re)seed → TTL long + `swr` (sert la version
  // en cache immédiatement puis revalide en arrière-plan). `cache` wrappe les handlers en cached
  // handler ET émet le `Cache-Control` (navigateur + CDN) ; aucun binding requis (on n'active pas
  // le cache durable NuxtHub, provisionné par `nuxthub deploy`, alors qu'ici le déploiement passe
  // par Wrangler/CF Builds). La clé de cache par défaut inclut l'URL → `?classIds` varie bien.
  routeRules: {
    '/api/catalog/**': { cache: { maxAge: 60 * 60, staleMaxAge: 60 * 60 * 24, swr: true } },
  },

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
      // Sans ça, vite-pwa retombe sur son défaut `en` alors que l'app est en français.
      lang: 'fr',
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
            /^\/api\/(catalog|spells|items|backgrounds|classes|magic_schools|invocations|character_species|feats)/.test(url.pathname),
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
