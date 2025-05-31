import type { InsertSpell } from '../utils/drizzle'

export default eventHandler(async (event) => {
  const spell = await readBody<InsertSpell>(event)

  const response = await useDrizzle().insert(tables.spells).values(spell).returning().get()

  return response
})
