import { db } from '~~/server/utils/db'
import { writeAccountPreferences } from '~~/server/utils/accountPreferences'
import { preferencesSchema } from '~~/shared/rules/preferences'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const result = await readValidatedBody(event, preferencesSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  return { preferences: await writeAccountPreferences(db, user.id, result.data) }
})
