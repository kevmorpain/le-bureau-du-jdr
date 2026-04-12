import { db, schema } from 'hub:db'

interface SpellSlotInput {
  slotLevel: number
  slotType: 'spellcasting' | 'pact_magic'
  total: number
  used: number
}

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)
  const slots = await readBody<SpellSlotInput[]>(event)

  if (!id || !Array.isArray(slots)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  await db
    .insert(schema.characterSpellSlots)
    .values(slots.map(s => ({ ...s, characterSheetId })))
    .onConflictDoUpdate({
      target: [
        schema.characterSpellSlots.characterSheetId,
        schema.characterSpellSlots.slotLevel,
        schema.characterSpellSlots.slotType,
      ],
      set: {
        total: sql`excluded.total`,
        used: sql`excluded.used`,
      },
    })

  return { success: true }
})
