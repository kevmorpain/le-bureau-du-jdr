import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const result = await readBody(event)

  return await db.update(schema.characterSheets).set({ alignment: result.alignment }).where(eq(tables.characterSheets.id, Number(id))).returning()
})
