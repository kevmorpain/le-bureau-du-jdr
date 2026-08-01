import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import { CharacterValidationError } from '~~/server/utils/characterCreate'
import { REST_TYPES, REST_RECHARGE_MAP } from '~~/shared/utils/rest'
import type { RechargeType } from '~~/server/db/schema/features'

/**
 * Logique de REPOS extraite du handler (point 5d, volet 4) — `db` INJECTÉ (testable libsql),
 * écritures rendues atomiques par un seul `db.batch()` (jamais `db.transaction()`).
 *
 * ⚠️ Dépendance d'ORDRE préservée : sur un repos LONG, on met d'abord `currentHp = maxHp`, PUIS
 * (si des dés de vie sont dépensés) le soin recalcule `min(currentHp LU + soin, maxHp)` à partir de
 * la valeur LUE au début — donc ce dernier écrase le plein soin. C'est le comportement historique
 * (sur un repos long sans dés dépensés, c'est un no-op) : l'ordre des statements dans le batch le
 * reproduit exactement.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export const restSchema = z.object({
  type: z.enum(REST_TYPES),
  hitDiceSpent: z.array(z.object({
    die: z.string(),
    count: z.number().int().min(0),
    healAmount: z.number().int().min(0),
  })).optional().default([]),
})

export type RestInput = z.infer<typeof restSchema>

export async function characterRest(db: Db, characterSheetId: number, input: RestInput): Promise<{ success: true, restType: string }> {
  const { type, hitDiceSpent } = input

  // `.query` (API relationnelle) n'est pas typé sur le `Db` générique (schéma `any`) → cast.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characterSheet = await (db as any).query.characterSheets.findFirst({
    where: eq(schema.characterSheets.id, characterSheetId),
    with: {
      features: { with: { feature: true } },
      classes: { with: { class: true } },
    },
  })
  if (!characterSheet) throw new CharacterValidationError('Personnage introuvable.')

  const rechargingTypes = REST_RECHARGE_MAP[type]

  // Features à recharger (dont le type de recharge est couvert par ce repos)
  const rechargingFeatureIds = characterSheet.features
    .filter((cf: { feature?: { rechargeType?: string | null } | null, featureId: number }) =>
      cf.feature?.rechargeType && rechargingTypes.includes(cf.feature.rechargeType as RechargeType))
    .map((cf: { featureId: number }) => cf.featureId)

  // Objets à charges à recharge COMPLÈTE (recharge_dice null) — lecture avant le batch.
  const invToRecharge = await db
    .select({ invId: schema.characterInventory.id })
    .from(schema.characterInventory)
    .innerJoin(schema.items, eq(schema.characterInventory.itemId, schema.items.id))
    .where(and(
      eq(schema.characterInventory.characterSheetId, characterSheetId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inArray(schema.items.rechargeType, rechargingTypes as any),
      isNull(schema.items.rechargeDice),
    ))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stmts: any[] = []

  if (rechargingFeatureIds.length) {
    stmts.push(db.update(schema.characterFeatures)
      .set({ currentUses: 0 })
      .where(and(
        eq(schema.characterFeatures.characterSheetId, characterSheetId),
        inArray(schema.characterFeatures.featureId, rechargingFeatureIds),
      )))
  }

  if (invToRecharge.length) {
    stmts.push(db.update(schema.characterInventory)
      .set({ currentUses: 0 })
      .where(inArray(schema.characterInventory.id, invToRecharge.map((r: { invId: number }) => r.invId))))
  }

  // Repos court : réinitialise les emplacements de magie de pacte
  if (type === 'short') {
    stmts.push(db.update(schema.characterSpellSlots)
      .set({ used: 0 })
      .where(and(
        eq(schema.characterSpellSlots.characterSheetId, characterSheetId),
        eq(schema.characterSpellSlots.slotType, 'pact_magic'),
      )))
  }

  // Repos long : PV au max, tous les emplacements réinitialisés, dés de vie récupérés
  if (type === 'long') {
    const hitDiceMax: Record<string, number> = {}
    for (const cls of characterSheet.classes ?? []) {
      const die = (cls.class as { hitDice?: string } | undefined)?.hitDice?.slice(1)
      if (die) hitDiceMax[die] = (hitDiceMax[die] ?? 0) + cls.level
    }
    const currentHitDie = characterSheet.currentHitDie
      ?? Object.entries(hitDiceMax).map(([die, count]) => ({ die, count }))
    const newHitDie = currentHitDie.map((entry: { die: string, count: number }) => ({
      die: entry.die,
      count: Math.min(hitDiceMax[entry.die] ?? entry.count, entry.count + Math.ceil((hitDiceMax[entry.die] ?? 0) / 2)),
    }))

    stmts.push(db.update(schema.characterSheets)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ currentHp: characterSheet.maxHp, currentHitDie: newHitDie } as any)
      .where(eq(schema.characterSheets.id, characterSheetId)))
    stmts.push(db.update(schema.characterSpellSlots)
      .set({ used: 0 })
      .where(eq(schema.characterSpellSlots.characterSheetId, characterSheetId)))
  }

  // Soin par dés de vie — DOIT rester APRÈS le repos long (cf. dépendance d'ordre en tête).
  if (hitDiceSpent.length > 0) {
    const totalHeal = hitDiceSpent.reduce((sum, d) => sum + d.healAmount, 0)
    const newHp = Math.min(characterSheet.currentHp + totalHeal, characterSheet.maxHp)
    stmts.push(db.update(schema.characterSheets)
      .set({ currentHp: newHp })
      .where(eq(schema.characterSheets.id, characterSheetId)))
  }

  if (stmts.length) {
    // db.batch() = atomique sur D1 (JAMAIS db.transaction()). Ordre des statements préservé.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).batch(stmts as [any, ...any[]])
  }

  return { success: true, restType: type }
}
