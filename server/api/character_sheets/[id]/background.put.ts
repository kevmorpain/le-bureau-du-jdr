import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  backgroundId: z.number().int().positive().nullable(),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  const result = await readValidatedBody(event, bodySchema.safeParse)
  if (!result.success) {
    throw createError({ statusCode: 422, data: result.error })
  }

  const { backgroundId } = result.data

  await db
    .update(schema.characterSheets)
    .set({ backgroundId, updatedAt: new Date().toISOString() })
    .where(eq(schema.characterSheets.id, characterSheetId))

  await db
    .delete(schema.characterSkills)
    .where(
      and(
        eq(schema.characterSkills.characterSheetId, characterSheetId),
        eq(schema.characterSkills.source, 'background'),
      ),
    )

  if (backgroundId) {
    const bg = await db.query.backgrounds.findFirst({
      where: eq(schema.backgrounds.id, backgroundId),
    })

    if (bg?.skillProficiencies?.length) {
      await db
        .insert(schema.characterSkills)
        .values(
          bg.skillProficiencies.map(skillKey => ({
            characterSheetId,
            skillKey,
            proficiencyLevel: 'proficient' as const,
            source: 'background' as const,
            isOverride: false,
          })),
        )
        .onConflictDoUpdate({
          target: [
            schema.characterSkills.characterSheetId,
            schema.characterSkills.skillKey,
            schema.characterSkills.source,
          ],
          set: { proficiencyLevel: sql`excluded.proficiency_level` },
        })
    }
  }

  return { success: true }
})
