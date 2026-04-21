import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { proficiencyType, value } = await readBody<{ proficiencyType: string, value: string }>(event)

  if (!id || !proficiencyType || !value) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .delete(schema.characterProficiencyOverrides)
    .where(
      and(
        eq(schema.characterProficiencyOverrides.characterSheetId, Number(id)),
        eq(schema.characterProficiencyOverrides.proficiencyType, proficiencyType as 'weapon' | 'armor'),
        eq(schema.characterProficiencyOverrides.value, value),
      ),
    )

  return { success: true }
})
