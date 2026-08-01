import { db } from 'hub:db'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '~~/server/utils/characterCreate'

/**
 * Handler MINCE : auth + validation de forme (Zod) + délégation à `createCharacter`
 * (server/utils/characterCreate.ts), qui dérive, valide les choix (autorité serveur) et
 * persiste atomiquement en `db.batch()`. La logique est extraite dans un util à `db` injecté
 * → testable contre libsql sans la barrière d'auth (cf. test/nuxt/createCharacter.test.ts).
 */
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
    // Choix illégal détecté par l'autorité serveur → 422 (message métier).
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})
