import { db } from 'hub:db'
import { loadMetamagic } from '~~/server/utils/catalogSources'
import { isExtendedRequested } from '~~/server/utils/catalogRequest'

export default defineEventHandler(async (event) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await loadMetamagic(db as any, '5', isExtendedRequested(event))
})
