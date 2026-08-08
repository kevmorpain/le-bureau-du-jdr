import { and, eq, inArray, isNotNull, isNull, lte, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

/**
 * Dérivation de la LIGNÉE choisie (chantier lignée, D17). Un personnage « base + lignée »
 * (ex. Elfe + Haut-elfe) dérive, EN PLUS des traits de son espèce de base, les features de la
 * lignée qu'il a choisie — exactement comme une sous-classe grante ses features. La fiche les
 * fusionne dans le même bucket que les traits d'espèce, si bien que rien en aval ne fait la
 * différence (mêmes effets → même dérivation de PV/CA/mods/sorts).
 *
 * `character_choices` / `species_lineages` / `features.lineage_id` ne sont PAS dans les
 * relations du cache `hub:db` → on lit par `.select()` explicite et on merge en JS (patron
 * des subclasses/ASI/item_effects du GET fiche). Le `db` est INJECTÉ → testable sur libsql.
 *
 * Gating par `level_required` (comparé au niveau TOTAL du perso, un trait d'espèce n'étant pas
 * lié à une classe). L'étalement fin des sorts de lignée (drow niv.3/5) est porté par
 * `spell_grant.unlockLevel` DANS l'effet — géré en aval comme pour l'ancien drow — et non par
 * `level_required` de la feature (toutes à 1).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

type EffectRow = typeof srcSchema.effects.$inferSelect
type FeatureRow = typeof srcSchema.features.$inferSelect

/** Une feature de lignée, à la forme d'une entrée `species.speciesFeatures[]` du GET fiche. */
export interface DerivedLineageFeature {
  speciesId: number
  featureId: number
  feature: FeatureRow & { featureEffects: { effect: EffectRow }[] }
}

export interface DerivedLineage {
  /** Features de la lignée, à concaténer à `species.speciesFeatures`. */
  features: DerivedLineageFeature[]
  /**
   * Vitesse imposée par la lignée (effet `walking_speed`), ou `null` si la lignée ne la change
   * pas. La fiche lit la COLONNE `species.speed` (`useCharacterClasses`), pas l'effet ; l'espèce
   * de base porte une vitesse par défaut, donc une lignée « rapide » (Elfe des bois 10,5 m) doit
   * la surcharger — l'endpoint remplace `species.speed` par cette valeur.
   */
  speedOverride: number | null
}

/**
 * Dérive la lignée choisie par le personnage : ses features (prêtes pour `species.speciesFeatures`)
 * et une éventuelle surcharge de vitesse. Tout est vide/`null` si aucune lignée n'est choisie
 * (cas de toutes les fiches existantes → dérivation inchangée, no-op).
 */
export async function deriveChosenLineage(
  db: Db,
  characterSheetId: number,
  baseSpeciesId: number,
  totalLevel: number,
): Promise<DerivedLineage> {
  const empty: DerivedLineage = { features: [], speedOverride: null }

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

  const features = await db
    .select()
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.lineageId, lineageId),
      or(isNull(srcSchema.features.levelRequired), lte(srcSchema.features.levelRequired, totalLevel)),
    ))
  if (!features.length) return empty

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

  return { features: derivedFeatures, speedOverride }
}
