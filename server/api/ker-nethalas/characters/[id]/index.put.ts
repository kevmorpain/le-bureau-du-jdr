import { db } from '~~/server/utils/db'
import { updateKnCharacter } from '~~/server/utils/knCharacters'
import { requireKnCharacterId } from '~~/server/utils/knRoute'
import { updateKnCharacterSchema } from '~~/shared/ker-nethalas/character'

export default defineEventHandler(async (event) => {
  const id = requireKnCharacterId(event)

  const result = await readValidatedBody(event, updateKnCharacterSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const updated = await updateKnCharacter(db, id, result.data)

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Character not found' })
  }

  return updated
})
