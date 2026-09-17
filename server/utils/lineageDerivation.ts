import { and, eq, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// Gating par `level_required` comparé au niveau TOTAL (un trait d'espèce n'est pas lié à une classe).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

type EffectRow = typeof srcSchema.effects.$inferSelect
type FeatureRow = typeof srcSchema.features.$inferSelect

export interface DerivedLineageFeature {
  speciesId: number
  featureId: number
  feature: FeatureRow & { featureEffects: { effect: EffectRow }[] }
}

export interface DerivedLineage {
  features: DerivedLineageFeature[]
  /** La fiche lit la colonne `species.speed`, pas l'effet : une lignée « rapide » doit la surcharger. */
  speedOverride: number | null
  lineageName: string | null
}

export async function deriveChosenLineage(
  db: Db,
  characterSheetId: number,
  baseSpeciesId: number,
  totalLevel: number,
): Promise<DerivedLineage> {
  const empty: DerivedLineage = { features: [], speedOverride: null, lineageName: null }

  const pick = await db
    .select({ lineageId: srcSchema.characterChoices.selectedLineageId })
    .from(srcSchema.characterChoices)
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      isNotNull(srcSchema.characterChoices.selectedLineageId),
    ))
    .limit(1)
  const lineageId = pick[0]?.lineageId
  if (lineageId == null) return empty

  const lineageRow = await db
    .select({ name: srcSchema.speciesLineages.name })
    .from(srcSchema.speciesLineages)
    .where(eq(srcSchema.speciesLineages.id, lineageId))
    .limit(1)
  const lineageName = lineageRow[0]?.name ?? null

  const features = await db
    .select()
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.lineageId, lineageId),
      or(isNull(srcSchema.features.levelRequired), lte(srcSchema.features.levelRequired, totalLevel)),
    ))
  // Lignée choisie mais aucune feature active (toutes gated au-dessus du niveau) → on garde quand
  // même le nom pour l'affichage de l'identité de lignée.
  if (!features.length) return { features: [], speedOverride: null, lineageName }

  const ids = features.map(f => f.id)
  const effectRows = await db
    .select({ featureId: srcSchema.featureEffects.featureId, effect: srcSchema.effects })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(inArray(srcSchema.featureEffects.featureId, ids))

  const effectsByFeature = new Map<number, EffectRow[]>()
  for (const row of effectRows) {
    const list = effectsByFeature.get(row.featureId) ?? []
    list.push(row.effect)
    effectsByFeature.set(row.featureId, list)
  }

  const speedEffect = effectRows.find(r => r.effect.type === 'walking_speed')
  const speedOverride = typeof speedEffect?.effect.value === 'number' ? speedEffect.effect.value : null

  const derivedFeatures = features.map(f => ({
    speciesId: baseSpeciesId,
    featureId: f.id,
    feature: { ...f, featureEffects: (effectsByFeature.get(f.id) ?? []).map(effect => ({ effect })) },
  }))

  return { features: derivedFeatures, speedOverride, lineageName }
}
