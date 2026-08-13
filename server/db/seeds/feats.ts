import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '../schema/effects'
import { featsData } from './data/feats'
import { rulesetOf } from './lib/rulesetOf'

export default async function seed() {
  let inserted = 0

  for (const feat of featsData) {
    // Keyé par (name, featureType, ruleset) : un don 5.5 homonyme (« Vigilant » dont les effets
    // diffèrent) est une ligne DISTINCTE, pas une mise à jour de la 2014 (D2). Un don est une OPTION
    // (filtrée par features.ruleset dans resolveOptions) → doit être estampillé. No-op sur le 2014.
    const existing = await db.query.features.findFirst({
      where: and(
        eq(schema.features.name, feat.name),
        eq(schema.features.featureType, 'feat'),
        eq(schema.features.ruleset, rulesetOf(feat)),
      ),
    })

    const prerequisites = feat.prerequisites ?? null

    let feature
    if (existing) {
      feature = existing
      // Resync description + prérequis s'ils ont changé entre deux versions du seed.
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
          description: feat.description,
          featureType: 'feat',
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

  return { inserted, skipped: featsData.length - inserted }
}

async function _seedEffects(featureId: number, effects: Effect[]) {
  // Idempotence : on retire d'abord les liens existants de la feature, sinon une
  // modification de la valeur d'un effet (ex : ajout de `abilities`) crée un
  // nouvel effet ET garde l'ancien lien → doublon. On reconstruit proprement.
  // hub:db schema cache ne connaît pas forcément l'effet le plus récent, on
  // utilise srcSchema pour les comparaisons fines.
  await db.delete(srcSchema.featureEffects).where(eq(srcSchema.featureEffects.featureId, featureId))
  for (const effect of effects) {
    const existing = await db
      .select()
      .from(srcSchema.effects)
      .where(and(eq(srcSchema.effects.type, effect.type), eq(srcSchema.effects.value, effect.value)))
      .limit(1)
      .get()
    const effectId = existing?.id ?? await db
      .insert(srcSchema.effects)
      .values({ type: effect.type, value: effect.value })
      .returning()
      .get()
      .then(r => r.id)
    await db.insert(srcSchema.featureEffects).values({ featureId, effectId }).onConflictDoNothing()
  }
}
