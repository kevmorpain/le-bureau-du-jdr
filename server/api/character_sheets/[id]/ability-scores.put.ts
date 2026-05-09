import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  const body = await readBody<{ abilityId: string, value: number }[]>(event)

  if (!id || !Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .insert(schema.characterAbilityScores)
    .values(body.map(s => ({
      characterSheetId,
      abilityId: s.abilityId,
      value: s.value,
    })))
    .onConflictDoUpdate({
      target: [
        schema.characterAbilityScores.characterSheetId,
        schema.characterAbilityScores.abilityId,
      ],
      set: { value: sql`excluded.value` },
    })

  return { success: true }
})
