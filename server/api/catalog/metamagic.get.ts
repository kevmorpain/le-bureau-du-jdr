import { db } from '~~/server/utils/db'
import { loadMetamagic } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  return await loadMetamagic(db, '5', isExtendedRequested(event))
})
