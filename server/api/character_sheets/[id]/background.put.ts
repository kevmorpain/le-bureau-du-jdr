import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
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

  // Les compétences d'historique sont DÉRIVÉES du nouvel historique (effets skill_proficiency) : rien à
  // (ré)insérer. On purge d'éventuelles lignes legacy `source:'background'` non-override (matérialisation
  // d'avant F3) pour ne pas laisser traîner celles de l'ancien historique.
  await db
    .delete(schema.characterSkills)
    .where(
      and(
        eq(schema.characterSkills.characterSheetId, characterSheetId),
        eq(schema.characterSkills.source, 'background'),
        eq(schema.characterSkills.isOverride, false),
      ),
    )

  return { success: true }
})
