import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      {
        // Alias `~~` = racine du projet, comme dans Nuxt : les modules purs de `shared/`
        // et `app/` (qui l'utilisent pour s'importer entre eux) restent testables dans
        // le projet unit, sans démarrer Nuxt.
        resolve: {
          alias: { '~~': fileURLToPath(new URL('.', import.meta.url)) },
        },
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          // Les tests d'intégration DB (buildCatalog, createCharacter) rejouent toute la chaîne
          // de migrations en mémoire ; sous exécution concurrente, le setupNuxt() des autres
          // fichiers nuxt dépasse le hookTimeout par défaut (10 s). On le relève pour le projet.
          hookTimeout: 60000,
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
    ],
  },
})
