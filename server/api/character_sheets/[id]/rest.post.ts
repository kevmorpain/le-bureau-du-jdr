import { db, schema } from 'hub:db'
import { z } from 'zod'
import { REST_TYPES, REST_RECHARGE_MAP } from '~~/shared/utils/rest'
import type { RechargeType } from '~~/server/db/schema/features'

const restSchema = z.object({
  type: z.enum(REST_TYPES),
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
    with: {
      features: { with: { feature: true } },
      classes: { with: { class: true } },
    },
  })

  if (!characterSheet) {
    throw createError({ statusCode: 404, statusMessage: 'Character sheet not found' })
  }

  // ── Recharge features ──────────────────────────────────────────────────────

  const rechargingTypes = REST_RECHARGE_MAP[type]
  const rechargingFeatures = characterSheet.features.filter(
    cf => cf.feature?.rechargeType && rechargingTypes.includes(cf.feature.rechargeType as RechargeType),
  )

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

  // ── Long rest: restore HP, reset spell slots, recover hit dice ───────────

  if (type === 'long') {
    const hitDiceMax: Record<string, number> = {}
    for (const cls of characterSheet.classes ?? []) {
      const die = (cls.class as { hitDice?: string } | undefined)?.hitDice?.slice(1)
      if (die) hitDiceMax[die] = (hitDiceMax[die] ?? 0) + cls.level
    }

    const currentHitDie = characterSheet.currentHitDie
      ?? Object.entries(hitDiceMax).map(([die, count]) => ({ die, count }))

    const newHitDie = currentHitDie.map(entry => ({
      die: entry.die,
      count: Math.min(
        hitDiceMax[entry.die] ?? entry.count,
        entry.count + Math.ceil((hitDiceMax[entry.die] ?? 0) / 2),
      ),
    }))

    await Promise.all([
      db
        .update(schema.characterSheets)
        .set({ currentHp: characterSheet.maxHp, currentHitDie: newHitDie })
        .where(eq(schema.characterSheets.id, characterSheetId)),
      db
        .update(schema.characterSpellSlots)
        .set({ used: 0 })
        .where(eq(schema.characterSpellSlots.characterSheetId, characterSheetId)),
    ])
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
