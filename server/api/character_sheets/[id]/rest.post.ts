import { db } from 'hub:db'
import { characterRest, restSchema } from '~~/server/utils/characterRest'
import { CharacterValidationError } from '~~/server/utils/characterCreate'

/**
 * Handler MINCE : auth (via middleware d'authz) + validation de forme (Zod) + délégation à
 * `characterRest` (server/utils/characterRest.ts), qui applique le repos atomiquement en
 * `db.batch()`. Logique extraite dans un util à `db` injecté → testable contre libsql
 * (cf. test/nuxt/characterRest.test.ts).
 */
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const input = await readValidatedBody(event, restSchema.parse)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await characterRest(db as any, characterSheetId, input)
  }
  catch (e) {
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})
