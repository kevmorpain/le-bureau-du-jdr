import { db, schema } from 'hub:db'
import { proficiencyOverrideSchema } from '~~/shared/utils/item'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const body = await readValidatedBody(event, proficiencyOverrideSchema.parse)

  await db
    .insert(schema.characterProficiencyOverrides)
    .values({
      characterSheetId: Number(id),
      proficiencyType: body.proficiencyType,
      value: body.value,
      action: body.action,
    })
    .onConflictDoUpdate({
      target: [
        schema.characterProficiencyOverrides.characterSheetId,
        schema.characterProficiencyOverrides.proficiencyType,
        schema.characterProficiencyOverrides.value,
      ],
      set: { action: sql`excluded.action` },
    })

  return { success: true }
})
