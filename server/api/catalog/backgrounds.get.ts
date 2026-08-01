import { db } from 'hub:db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'

/**
 * Catalogue : historiques GLOBAUX uniquement (tranche statique, cachable). Les historiques
 * homebrew rattachés à une fiche ne sont PAS du catalogue — ils restent servis par l'endpoint
 * legacy `/api/backgrounds?characterSheetId=`. Cf. lot 6a.
 */
export default defineEventHandler(async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadBackgrounds(db as any)
})
