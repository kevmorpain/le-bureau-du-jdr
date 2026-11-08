import { db, schema } from '~~/server/utils/db'
import { effectIdFor } from '~~/server/utils/effectRows'
import { and, eq } from 'drizzle-orm'
import type { Effect } from '../schema/effects'
import { boonsData } from './data/boons'
import { featsData } from './data/feats'
import { rulesetOf } from './lib/rulesetOf'

// Les faveurs permanentes (manuels et tomes) se sèment avec les dons : même table, même chemin d'ajout à une fiche.
const SEEDED = [
  ...featsData.map(entry => ({ feat: entry, featureType: 'feat' as const })),
  ...boonsData.map(entry => ({ feat: { ...entry, prerequisites: null }, featureType: 'boon' as const })),
]

export default async function seed() {
  let inserted = 0

  for (const { feat, featureType } of SEEDED) {
    // Keyé par (name, featureType, ruleset) : un don 5.5 homonyme est une ligne DISTINCTE (D2).
    const existing = await db.query.features.findFirst({
      where: and(
        eq(schema.features.name, feat.name),
        eq(schema.features.featureType, featureType),
        eq(schema.features.ruleset, rulesetOf(feat)),
      ),
    })

    const prerequisites = feat.prerequisites ?? null

    let feature
    if (existing) {
      feature = existing
      const patch: Record<string, unknown> = {}
      if (existing.description !== feat.description) patch.description = feat.description
      if (JSON.stringify(existing.prerequisites ?? null) !== JSON.stringify(prerequisites)) {
        patch.prerequisites = prerequisites
      }
      if (Object.keys(patch).length > 0) {
        await db
          .update(schema.features)
          .set(patch as any)
          .where(eq(schema.features.id, existing.id))
      }
    }
    else {
      feature = await db
        .insert(schema.features)
        .values({
          name: feat.name,
          ruleset: rulesetOf(feat),
          source: feat.source ?? 'core',
          description: feat.description,
          featureType,
          classId: null,
          subclassId: null,
          levelRequired: null,
          actionType: null,
          rechargeType: null,
          maxUsesFormula: null,
          meta: null,
          prerequisites,
        } as any)
        .returning()
        .get()
      inserted++
    }

    await _seedEffects(feature.id, feat.effects)
  }

  return { inserted, skipped: SEEDED.length - inserted }
}

async function _seedEffects(featureId: number, effects: Effect[]) {
  // On efface d'abord les liens : sinon une valeur d'effet modifiée crée un nouvel effet ET garde
  // l'ancien lien → doublon.
  await db.delete(schema.featureEffects).where(eq(schema.featureEffects.featureId, featureId))
  for (const effect of effects) {
    const effectId = await effectIdFor(db, effect)
    await db.insert(schema.featureEffects).values({ featureId, effectId }).onConflictDoNothing()
  }
}
