import { db } from '~~/server/utils/db'
import { createKnCharacter } from '~~/server/utils/knCharacters'
import { createKnCharacterSchema } from '~~/shared/ker-nethalas/character'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, createKnCharacterSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const created = await createKnCharacter(db, user.id, result.data)
  setResponseStatus(event, 201)
  return created
})
