import { db } from '~~/server/utils/db'
import { saveKnContent } from '~~/server/utils/knContent'
import { requireSeedSecret } from '~~/server/utils/seedSecret'

export default defineEventHandler(async (event) => {
  requireSeedSecret(event)

  const name = getRouterParam(event, 'name') ?? ''
  const result = await saveKnContent(db, name, await readBody(event))

  if (result.status === 'unknown') throw createError({ statusCode: 404, statusMessage: 'Unknown content set' })
  if (result.status === 'tooLarge') throw createError({ statusCode: 413, statusMessage: 'Content set too large', data: { bytes: result.bytes } })
  if (result.status === 'invalid') throw createError({ statusCode: 422, statusMessage: 'Invalid content set', data: result.issues })

  return { name: result.name }
})
