import { db } from 'hub:db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Avec `?characterSheetId=`, ajoute les historiques homebrew de la fiche (non cachable).
export default defineEventHandler(async (event) => {
  const { characterSheetId } = getQuery(event)
  const charId = characterSheetId ? Number(characterSheetId) : undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadBackgrounds(db as any, charId, '5', isExtendedRequested(event))
})
