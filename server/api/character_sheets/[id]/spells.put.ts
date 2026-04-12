import { db, schema } from 'hub:db'

interface SpellInput {
  spellId: number
  isKnown?: boolean
  isPrepared?: boolean
}

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  const spells = await readBody<SpellInput[]>(event)

  if (!id || !Array.isArray(spells)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .insert(schema.characterSpells)
    .values(spells.map(s => ({
      characterSheetId,
      spellId: s.spellId,
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

  return { success: true }
})
