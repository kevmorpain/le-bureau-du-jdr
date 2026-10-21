import { db } from '~~/server/utils/db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Historiques globaux uniquement : les homebrew d'une fiche sont servis par `/api/character_sheets/<id>/backgrounds`.
export default defineEventHandler(async (event) => {
  return await loadBackgrounds(db, undefined, '5', isExtendedRequested(event))
})
