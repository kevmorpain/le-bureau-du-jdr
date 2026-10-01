import { db } from '~~/server/utils/db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Avec `?characterSheetId=`, ajoute les historiques homebrew de la fiche (non cachable).
export default defineEventHandler(async (event) => {
  const { characterSheetId } = getQuery(event)
  const charId = characterSheetId ? Number(characterSheetId) : undefined

  return await loadBackgrounds(db, charId, '5', isExtendedRequested(event))
})
