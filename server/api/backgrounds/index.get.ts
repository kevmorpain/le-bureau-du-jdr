import { db } from 'hub:db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'

// Legacy — conservé pour le front actuel (repoint = lot 6b). Délègue au loader partagé du
// catalogue. La variante per-fiche (`?characterSheetId=`) ajoute les historiques homebrew de la
// fiche (non cachable) ; sans paramètre, la sortie est identique à `/api/catalog/backgrounds`.
export default defineEventHandler(async (event) => {
  const { characterSheetId } = getQuery(event)
  const charId = characterSheetId ? Number(characterSheetId) : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadBackgrounds(db as any, charId)
})
