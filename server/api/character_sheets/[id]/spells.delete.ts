import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { spellId } = await readBody<{ spellId: number }>(event)

  if (!id || !spellId) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .delete(schema.characterSpells)
    .where(
      and(
        eq(schema.characterSpells.characterSheetId, Number(id)),
        eq(schema.characterSpells.spellId, spellId),
      ),
    )

  return { success: true }
})
