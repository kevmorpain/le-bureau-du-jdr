import { db } from 'hub:db'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '~~/server/utils/characterCreate'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, createCharacterSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { id } = await createCharacter(db as any, result.data, (user as any).id)
    setResponseStatus(event, 201)
    return { id }
  }
  catch (e) {
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})
