import { db } from '~~/server/utils/db'
import { listKnContent } from '~~/server/utils/knContent'
import { requireSeedSecret } from '~~/server/utils/seedSecret'

export default defineEventHandler(async (event) => {
  requireSeedSecret(event)

  return await listKnContent(db)
})
