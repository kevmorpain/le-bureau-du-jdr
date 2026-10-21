import { db, schema } from '~~/server/utils/db'
import { proficiencyOverrideDeleteSchema } from '~~/shared/utils/proficiency_overrides'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const result = await readValidatedBody(event, proficiencyOverrideDeleteSchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }
  const { proficiencyType, value } = result.data

  await db
    .delete(schema.characterProficiencyOverrides)
    .where(
      and(
        eq(schema.characterProficiencyOverrides.characterSheetId, Number(id)),
        eq(schema.characterProficiencyOverrides.proficiencyType, proficiencyType),
        eq(schema.characterProficiencyOverrides.value, value),
      ),
    )

  await touchCharacterSheet(event, Number(id))
  return { success: true }
})
