import { db } from 'hub:db'
import { characterLevelUp, levelUpSchema } from '~~/server/utils/characterLevelUp'
import { CharacterValidationError } from '~~/server/utils/characterCreate'

/**
 * Handler MINCE : auth (via middleware d'authz) + validation de forme (Zod) + délégation à
 * `characterLevelUp` (server/utils/characterLevelUp.ts), qui dérive les emplacements de sorts,
 * valide les choix (autorité serveur) et persiste atomiquement en `db.batch()`. Logique extraite
 * dans un util à `db` injecté → testable contre libsql (cf. test/nuxt/characterLevelUp.test.ts).
 */
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  if (!characterSheetId) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  const result = await readValidatedBody(event, levelUpSchema.safeParse)
  if (!result.success) throw createError({ statusCode: 422, data: result.error })

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await characterLevelUp(db as any, characterSheetId, result.data)
  }
  catch (e) {
    if (e instanceof CharacterValidationError) {
      throw createError({ statusCode: 422, statusMessage: e.message })
    }
    throw e
  }
})
