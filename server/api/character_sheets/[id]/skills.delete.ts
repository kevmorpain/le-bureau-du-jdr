import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { skillKey, source } = await readBody<{ skillKey: string, source: string }>(event)

  if (!id || !skillKey || !source) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .delete(schema.characterSkills)
    .where(
      and(
        eq(schema.characterSkills.characterSheetId, Number(id)),
        eq(schema.characterSkills.skillKey, skillKey),
        eq(schema.characterSkills.source, source),
      ),
    )

  return { success: true }
})
