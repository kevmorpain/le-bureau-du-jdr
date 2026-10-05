import { and, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { CharacterValidationError } from '~~/server/utils/characterCreate'
import { loadSheetRelations, sheetHitPointsOf } from '~~/server/utils/characterSheetLoader'
import { hitDiceTotals, recoverHitDice } from '~~/shared/rules/hitDice'
import { rollDice } from '~~/shared/rules/dice'
import { resourceFeaturesOf, restRecovery } from '~~/shared/rules/classResources'
import { REST_TYPES, REST_RECHARGE_MAP } from '~~/shared/utils/rest'
import type { Db } from '~~/server/utils/db'

// ⚠️ Ordre : sur un repos long, `currentHp = maxHp` PUIS le soin par dés de vie recalcule depuis la valeur
// lue au début et écrase le plein soin. Comportement historique, reproduit par l'ordre du batch.

export const restSchema = z.object({
  type: z.enum(REST_TYPES),
  hitDiceSpent: z.array(z.object({
    die: z.string(),
    count: z.number().int().min(0),
    healAmount: z.number().int().min(0),
  })).optional().default([]),
  // Conditions : un repos long réduit l'épuisement de 1 « à condition que la créature ait aussi mangé et bu ».
  fedAndWatered: z.boolean().optional().default(true),
})

export type RestInput = z.input<typeof restSchema>

export interface RestResult {
  success: true
  restType: string
  exhaustionLevel: number
  rechargedItems: { inventoryId: number, name: string, rolled: number }[]
}

export async function characterRest(db: Db, characterSheetId: number, input: RestInput, rng: () => number = Math.random): Promise<RestResult> {
  const { type, hitDiceSpent = [], fedAndWatered = true } = input

  const characterSheet = await loadSheetRelations(db, characterSheetId)
  if (!characterSheet) throw new CharacterValidationError('Personnage introuvable.')

  const rechargingTypes = REST_RECHARGE_MAP[type]

  const resourceFeatures = resourceFeaturesOf(characterSheet.features)
  const recovery = restRecovery(resourceFeatures, characterSheet.classes ?? [], type)

  const rechargeable = await db
    .select({ invId: schema.characterInventory.id, name: schema.items.name, rechargeDice: schema.items.rechargeDice })
    .from(schema.characterInventory)
    .innerJoin(schema.items, eq(schema.characterInventory.itemId, schema.items.id))
    .where(and(
      eq(schema.characterInventory.characterSheetId, characterSheetId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inArray(schema.items.rechargeType, rechargingTypes as any),
    ))
  const invToRecharge = rechargeable.filter(r => r.rechargeDice === null)
  const invPartiallyRecharged = rechargeable.filter(r => r.rechargeDice !== null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []

  if (recovery.reset.length) {
    stmts.push(db.update(schema.characterFeatures)
      .set({ currentUses: 0 })
      .where(and(
        eq(schema.characterFeatures.characterSheetId, characterSheetId),
        inArray(schema.characterFeatures.featureId, recovery.reset),
      )))
  }

  for (const { featureId, amount } of recovery.regain) {
    stmts.push(db.update(schema.characterFeatures)
      .set({ currentUses: sql`MAX(0, ${schema.characterFeatures.currentUses} - ${amount})` })
      .where(and(
        eq(schema.characterFeatures.characterSheetId, characterSheetId),
        eq(schema.characterFeatures.featureId, featureId),
      )))
  }

  // Un repos met fin à ce qui dure une minute (Rage).
  if (type !== 'dawn' && resourceFeatures.some(f => f.active)) {
    stmts.push(db.update(schema.characterFeatures)
      .set({ active: false })
      .where(eq(schema.characterFeatures.characterSheetId, characterSheetId)))
  }

  if (invToRecharge.length) {
    stmts.push(db.update(schema.characterInventory)
      .set({ currentUses: 0 })
      .where(inArray(schema.characterInventory.id, invToRecharge.map((r: { invId: number }) => r.invId))))
  }

  // Recharge partielle (« 1d6+4 charges à l'aube ») : les charges rendues se tirent au repos, jamais sous zéro dépensée.
  const rechargedItems: RestResult['rechargedItems'] = []
  for (const row of invPartiallyRecharged) {
    const rolled = rollDice(row.rechargeDice!, rng)
    rechargedItems.push({ inventoryId: row.invId, name: row.name, rolled })
    stmts.push(db.update(schema.characterInventory)
      .set({ currentUses: sql`MAX(0, ${schema.characterInventory.currentUses} - ${rolled})` })
      .where(eq(schema.characterInventory.id, row.invId)))
  }

  if (type === 'short') {
    stmts.push(db.update(schema.characterSpellSlots)
      .set({ used: 0 })
      .where(and(
        eq(schema.characterSpellSlots.characterSheetId, characterSheetId),
        eq(schema.characterSpellSlots.slotType, 'pact_magic'),
      )))
  }

  let exhaustionLevel: number = characterSheet.exhaustionLevel
  if (type === 'long') {
    if (fedAndWatered) exhaustionLevel = Math.max(0, exhaustionLevel - 1)

    const newHitDie = recoverHitDice(
      characterSheet.currentHitDie,
      hitDiceTotals((characterSheet.classes ?? []).map((cls: { level: number, class?: { hitDice?: string } }) => ({ level: cls.level, hitDice: cls.class?.hitDice }))),
    )

    // Le maximum se lit après la baisse d'épuisement : au niveau 4 il est divisé par deux.
    const { maxHp } = sheetHitPointsOf({ ...characterSheet, exhaustionLevel })

    stmts.push(db.update(schema.characterSheets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ currentHp: maxHp, temporaryHp: 0, exhaustionLevel, deathSaveSuccesses: 0, deathSaveFailures: 0, currentHitDie: newHitDie } as any)
      .where(eq(schema.characterSheets.id, characterSheetId)))
    stmts.push(db.update(schema.characterSpellSlots)
      .set({ used: 0, created: 0 })
      .where(eq(schema.characterSpellSlots.characterSheetId, characterSheetId)))
  }

  // Soin par dés de vie — DOIT rester APRÈS le repos long (cf. dépendance d'ordre en tête).
  if (hitDiceSpent.length > 0) {
    const totalHeal = hitDiceSpent.reduce((sum, d) => sum + d.healAmount, 0)
    const { maxHp } = sheetHitPointsOf({ ...characterSheet, exhaustionLevel })
    const newHp = Math.min(characterSheet.currentHp + totalHeal, maxHp)
    // Regagner des PV remet les jets contre la mort à zéro.
    stmts.push(db.update(schema.characterSheets)
      .set(totalHeal > 0 ? { currentHp: newHp, deathSaveSuccesses: 0, deathSaveFailures: 0 } : { currentHp: newHp })
      .where(eq(schema.characterSheets.id, characterSheetId)))
  }

  if (stmts.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).batch(stmts as [any, ...any[]])
  }

  return { success: true, restType: type, exhaustionLevel, rechargedItems }
}
