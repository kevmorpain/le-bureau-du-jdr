import { db } from '~~/server/utils/db'
import { loadClassFeatures } from '~~/server/utils/catalogSources'

export default defineEventHandler(async () => {
  return await loadClassFeatures(db)
})
