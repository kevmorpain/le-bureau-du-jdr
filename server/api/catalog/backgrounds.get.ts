import { db } from 'hub:db'
import { loadBackgrounds } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

// Historiques globaux uniquement : les homebrew d'une fiche restent servis par `/api/backgrounds?characterSheetId=`.
export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadBackgrounds(db as any, undefined, '5', isExtendedRequested(event))
})
