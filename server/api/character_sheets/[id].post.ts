import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const result = await readBody(event)
  console.log(result)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      data: result.error,
    })
  }

  return await db.update(schema.characterSheets).set(result).where(eq(tables.characterSheets.id, Number(id))).returning()
})
