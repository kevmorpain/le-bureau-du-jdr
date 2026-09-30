import { db } from '~~/server/utils/db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Historiques globaux uniquement : les homebrew d'une fiche restent servis par `/api/backgrounds?characterSheetId=`.
export default defineEventHandler(async (event) => {
  return await loadBackgrounds(db, undefined, '5', isExtendedRequested(event))
})
