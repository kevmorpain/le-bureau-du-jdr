import { sheetIdFromPath } from '~~/shared/utils/sheetIdFromPath'
import { SHEET_VERSION_HEADER } from '~~/shared/utils/sheetVersion'

// Le serveur annonce dans chaque réponse d'écriture la version qu'il vient de poser sur la fiche. Écouter
// ici plutôt qu'à chaque appel : un `$fetch` qui l'oublierait laisserait la version de référence derrière
// le serveur, et le rejeu hors-ligne suivant y verrait un conflit que personne n'a provoqué.
export default defineNuxtPlugin(() => {
  globalThis.$fetch = globalThis.$fetch.create({
    onResponse({ request, response }) {
      const version = response.headers.get(SHEET_VERSION_HEADER)
      const characterId = typeof request === 'string' ? sheetIdFromPath(request) : null
      if (version && characterId !== null) setBaseVersion(characterId, version)
    },
  })
})
