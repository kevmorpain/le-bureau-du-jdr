import { db } from 'hub:db'

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, spellSchema.safeParse)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      data: result.error,
    })
  }

  const response = await db.insert(tables.spells).values(result.data).returning().get()

  return response
})
