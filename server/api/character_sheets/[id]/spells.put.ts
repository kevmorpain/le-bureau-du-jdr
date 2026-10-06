import { inArray } from 'drizzle-orm'
import { db, schema } from '~~/server/utils/db'

interface SpellInput {
  spellId: number
  isKnown?: boolean
  isPrepared?: boolean
  classId?: number | null
}

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  const spells = await readBody<SpellInput[]>(event)

  if (!id || !Array.isArray(spells)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const classIds = [...new Set(spells.map(s => s.classId).filter((c): c is number => c != null))]
  if (classIds.length) {
    const held = await db
      .select({ classId: schema.characterClasses.classId })
      .from(schema.characterClasses)
      .where(and(
        eq(schema.characterClasses.characterSheetId, characterSheetId),
        inArray(schema.characterClasses.classId, classIds),
      ))
    if (held.length !== classIds.length) {
      throw createError({ statusCode: 400, statusMessage: 'Class not on this character' })
    }
  }

  // La classe n'est posée qu'à l'insertion : cocher « préparé » ne doit pas réattribuer le sort.
  await db
    .insert(schema.characterSpells)
    .values(spells.map(s => ({
      characterSheetId,
      spellId: s.spellId,
      classId: s.classId ?? null,
      isKnown: s.isKnown ?? false,
      isPrepared: s.isPrepared ?? false,
    })))
    .onConflictDoUpdate({
      target: [schema.characterSpells.characterSheetId, schema.characterSpells.spellId],
      set: {
        isKnown: sql`excluded.is_known`,
        isPrepared: sql`excluded.is_prepared`,
      },
    })

  await touchCharacterSheet(event, characterSheetId)
  return { success: true }
})
