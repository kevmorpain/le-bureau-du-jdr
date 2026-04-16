import { db, schema } from 'hub:db'
import { z } from 'zod'

const restSchema = z.object({
  type: z.enum(['short', 'long']),
  hitDiceSpent: z.array(z.object({
    die: z.string(), // e.g. 'd8'
    count: z.number().int().min(0),
    healAmount: z.number().int().min(0),
  })).optional().default([]),
})

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const characterSheetId = Number(id)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID parameter is required' })
  }

  const { type, hitDiceSpent } = await readValidatedBody(event, restSchema.parse)

  const characterSheet = await db.query.characterSheets.findFirst({
    where: eq(schema.characterSheets.id, characterSheetId),
    with: { features: { with: { feature: true } } },
  })

  if (!characterSheet) {
    throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  }

  // ── Recharge features ──────────────────────────────────────────────────────

  const rechargingFeatures = characterSheet.features.filter((cf) => {
    const rechargeType = cf.feature?.rechargeType
    if (!rechargeType) return false
    if (type === 'long') return true // long rest recharges everything
    return rechargeType === 'short_rest'
  })

  if (rechargingFeatures.length > 0) {
    await Promise.all(rechargingFeatures.map(cf =>
      db
        .update(schema.characterFeatures)
        .set({ currentUses: 0 })
        .where(
          and(
            eq(schema.characterFeatures.characterSheetId, characterSheetId),
            eq(schema.characterFeatures.featureId, cf.featureId),
          ),
        ),
    ))
  }

  // ── Long rest: restore HP to max ───────────────────────────────────────────

  if (type === 'long') {
    await db
      .update(schema.characterSheets)
      .set({ currentHp: characterSheet.maxHp })
      .where(eq(schema.characterSheets.id, characterSheetId))
  }

  // ── Short rest: apply hit dice healing ────────────────────────────────────

  if (hitDiceSpent.length > 0) {
    const totalHeal = hitDiceSpent.reduce((sum, d) => sum + d.healAmount, 0)
    const newHp = Math.min(characterSheet.currentHp + totalHeal, characterSheet.maxHp)

    await db
      .update(schema.characterSheets)
      .set({ currentHp: newHp })
      .where(eq(schema.characterSheets.id, characterSheetId))
  }

  return { success: true, restType: type }
})
