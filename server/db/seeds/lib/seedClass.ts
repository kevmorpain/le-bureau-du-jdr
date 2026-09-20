import { db, schema } from 'hub:db'
// `progression` s'écrit via le schéma SOURCE : le cache de `hub:db` peut l'ignorer au démarrage.
import * as srcSchema from '../../schema'
import { eq, and, sql } from 'drizzle-orm'
import type { Effect } from '../../schema/effects'
import type { FeatureType, ActionType, RechargeType, FeatureMeta, FeaturePrerequisite } from '../../schema/features'
import type { FeatureTag } from '~~/shared/rules/featureTags'
import type { ChoiceKind, OptionSource } from '~~/shared/rules/choices'
import type { Formula } from '~~/shared/utils/formula'
import type { Ruleset } from '~~/shared/rules/ruleset'
import { subclassChoiceFeature, SUBCLASS_CHOICE_FEATURE_NAMES } from '../data/subclassChoice'
import { fightingStyleOptionFeatures } from '../data/fightingStyles'
import { CLASS_PROFICIENCIES } from '~~/shared/rules/classProficiencies'

/** Feature porteuse des maîtrises de base d'une classe : jamais affichée ni matérialisée. */
export const CLASS_PROFICIENCY_CARRIER_NAME = 'Maîtrises de la classe'

function buildProficiencyCarrier(className: string): FeatureDef | null {
  const prof = CLASS_PROFICIENCIES[className]
  if (!prof) return null
  return {
    name: CLASS_PROFICIENCY_CARRIER_NAME,
    description: null,
    featureType: 'proficiency_grant',
    levelRequired: 1,
    effects: [
      ...prof.savingThrows.map((value): Effect => ({ type: 'saving_throw_proficiency', value: { ability: value } })),
      ...prof.armor.map((value): Effect => ({ type: 'proficiency', value })),
      ...prof.weapon.map((value): Effect => ({ type: 'weapon_proficiency', value })),
    ],
  }
}

export type ProgressionDef = {
  kind: ChoiceKind
  count: Formula
  optionSource: OptionSource
  replaceable?: boolean
}

export type FeatureDef = {
  name: string
  description?: string | null
  featureType: FeatureType
  levelRequired?: number | null
  actionType?: ActionType | null
  rechargeType?: RechargeType | null
  maxUsesFormula?: Formula | null
  effects?: Effect[]
  meta?: FeatureMeta
  prerequisites?: FeaturePrerequisite | null
  tag?: FeatureTag | null
  progression?: ProgressionDef | null
}

export type SubclassDef = {
  name: string
  description?: string | null
  spellcastingAbility?: string | null
  features: FeatureDef[]
}

export async function seedClass(
  className: string,
  baseFeatures: FeatureDef[],
  subclassDefs: SubclassDef[],
  ruleset: Ruleset = '5',
): Promise<{ featuresInserted: number; subclassesInserted: number }> {
  let featuresInserted = 0
  let subclassesInserted = 0

  // Résolution par (name, ruleset) : les features d'une classe 5.5 doivent s'attacher à SA ligne,
  // pas à l'homonyme 2014.
  const cls = await db.query.classes.findFirst({
    where: and(eq(schema.classes.name, className), eq(schema.classes.ruleset, ruleset)),
  })
  if (!cls) {
    console.warn(`[seedClass] Classe "${className}" (${ruleset}) introuvable — skip`)
    return { featuresInserted, subclassesInserted }
  }

  const carrier = buildProficiencyCarrier(className)

  // Feature « choix de sous-classe » injectée à la volée depuis la source unique (niveau =
  // `classes.subclass_level`) : pas de câblage dupliqué dans les 12 wrappers.
  const subclassChoice = subclassDefs.length > 0 && SUBCLASS_CHOICE_FEATURE_NAMES[className]
    ? subclassChoiceFeature(className)
    : null

  const fightingStyleOptions = fightingStyleOptionFeatures(className)

  const allBaseFeatures = [
    ...baseFeatures,
    ...(carrier ? [carrier] : []),
    ...(subclassChoice ? [subclassChoice] : []),
    ...fightingStyleOptions,
  ]

  for (const featureDef of allBaseFeatures) {
    const { effects = [], meta, prerequisites, tag, progression: progressionDef, ...data } = featureDef
    // Important : on inclut `levelRequired` dans la clef d'unicité, sinon
    // les features récurrentes au même nom (ex. « Amélioration de caractéristiques »
    // gagnée à 4/8/12/16/19) sont fusionnées en une seule ligne en base et seul
    // le niveau de la première définition est lié au personnage au level-up.
    const existing = await db.query.features.findFirst({
      where: and(
        eq(schema.features.classId, cls.id),
        eq(schema.features.name, data.name),
        data.levelRequired != null
          ? eq(schema.features.levelRequired, data.levelRequired)
          : sql`${schema.features.levelRequired} IS NULL`,
      ),
    })
    let feature
    if (existing) {
      feature = existing
      // Le seed est la source de vérité du contenu : un seed corrigé doit mettre à jour une base peuplée.
      await _resyncFeatureContent(existing, data)
      if (meta !== undefined && meta !== null && JSON.stringify(existing.meta) !== JSON.stringify(meta)) {
        await db.run(sql`UPDATE features SET meta = ${JSON.stringify(meta)} WHERE id = ${existing.id}`)
      }
      if (prerequisites !== undefined && JSON.stringify(existing.prerequisites) !== JSON.stringify(prerequisites)) {
        await db.run(sql`UPDATE features SET prerequisites = ${prerequisites ? JSON.stringify(prerequisites) : null} WHERE id = ${existing.id}`)
      }
    }
    else {
      feature = await db
        .insert(schema.features)
        .values({
          ...data,
          classId: cls.id,
          maxUsesFormula: data.maxUsesFormula ?? null,
          meta: meta ?? null,
          prerequisites: prerequisites ?? null,
        })
        .returning()
        .get()
      featuresInserted++
    }
    await _syncFeatureTag(feature.id, tag)
    await _syncProgression(feature.id, progressionDef)
    await _seedEffects(feature.id, effects as Effect[])
  }

  for (const subclassDef of subclassDefs) {
    const existingSubclass = await db.query.subclasses.findFirst({
      where: and(eq(schema.subclasses.classId, cls.id), eq(schema.subclasses.name, subclassDef.name)),
    })
    let subclass
    if (existingSubclass) {
      subclass = existingSubclass
      const seedDesc = subclassDef.description ?? null
      if (existingSubclass.description !== seedDesc) {
        await db.run(sql`UPDATE subclasses SET description = ${seedDesc} WHERE id = ${existingSubclass.id}`)
      }
      const seedAbility = subclassDef.spellcastingAbility ?? null
      if (seedAbility !== null && existingSubclass.spellcastingAbility !== seedAbility) {
        await db.run(sql`UPDATE subclasses SET spellcasting_ability = ${seedAbility} WHERE id = ${existingSubclass.id}`)
      }
    }
    else {
      subclass = await db
        .insert(schema.subclasses)
        .values({
          classId: cls.id,
          name: subclassDef.name,
          description: subclassDef.description ?? null,
          spellcastingAbility: subclassDef.spellcastingAbility ?? null,
        })
        .returning()
        .get()
      subclassesInserted++
    }

    for (const featureDef of subclassDef.features) {
      const { effects = [], meta, tag, progression: progressionDef, ...data } = featureDef
      // Idem : scoper par niveau pour éviter la fusion des features homonymes.
      const existing = await db.query.features.findFirst({
        where: and(
          eq(schema.features.subclassId, subclass.id),
          eq(schema.features.name, data.name),
          data.levelRequired != null
            ? eq(schema.features.levelRequired, data.levelRequired)
            : sql`${schema.features.levelRequired} IS NULL`,
        ),
      })
      let feature
      if (existing) {
        feature = existing
        await _resyncFeatureContent(existing, data)
        if (meta !== undefined && meta !== null && JSON.stringify(existing.meta) !== JSON.stringify(meta)) {
          await db.run(sql`UPDATE features SET meta = ${JSON.stringify(meta)} WHERE id = ${existing.id}`)
        }
      }
      else {
        feature = await db
          .insert(schema.features)
          .values({
            ...data,
            subclassId: subclass.id,
            maxUsesFormula: data.maxUsesFormula ?? null,
            meta: meta ?? null,
          })
          .returning()
          .get()
        featuresInserted++
      }
      await _syncFeatureTag(feature.id, tag)
      await _syncProgression(feature.id, progressionDef)
      await _seedEffects(feature.id, effects as Effect[])
    }
  }

  return { featuresInserted, subclassesInserted }
}

/** Écriture par `sql` brut : robuste au cache de schéma `hub:db`, périmé après l'ajout de la colonne. */
async function _syncFeatureTag(featureId: number, tag: FeatureTag | null | undefined) {
  if (tag === undefined) return
  await db.run(sql`UPDATE features SET tag = ${tag ?? null} WHERE id = ${featureId}`)
}

/** Idempotent : une feature porte au plus une progression par `kind`. */
async function _syncProgression(featureId: number, prog: ProgressionDef | null | undefined) {
  if (!prog) return
  const existing = await db
    .select({ id: srcSchema.progression.id })
    .from(srcSchema.progression)
    .where(and(eq(srcSchema.progression.featureId, featureId), eq(srcSchema.progression.kind, prog.kind)))
    .limit(1)
    .get()
  const values = {
    count: prog.count,
    optionSource: prog.optionSource,
    replaceable: prog.replaceable ?? false,
  }
  if (existing) {
    await db.update(srcSchema.progression).set(values).where(eq(srcSchema.progression.id, existing.id))
  }
  else {
    await db.insert(srcSchema.progression).values({ featureId, kind: prog.kind, ...values })
  }
}

async function _resyncFeatureContent(
  existing: {
    id: number
    description: string | null
    actionType: ActionType | null
    rechargeType: RechargeType | null
    maxUsesFormula: Formula | null
  },
  data: {
    description?: string | null
    actionType?: ActionType | null
    rechargeType?: RechargeType | null
    maxUsesFormula?: Formula | null
  },
) {
  const desc = data.description ?? null
  const action = data.actionType ?? null
  const recharge = data.rechargeType ?? null
  const maxUses = data.maxUsesFormula ?? null
  const maxUsesJson = maxUses != null ? JSON.stringify(maxUses) : null
  const existingMaxUsesJson = existing.maxUsesFormula != null ? JSON.stringify(existing.maxUsesFormula) : null
  if (
    existing.description !== desc
    || existing.actionType !== action
    || existing.rechargeType !== recharge
    || existingMaxUsesJson !== maxUsesJson
  ) {
    await db.run(sql`UPDATE features SET description = ${desc}, action_type = ${action}, recharge_type = ${recharge}, max_uses_formula = ${maxUsesJson}, updated_at = ${new Date().toISOString()} WHERE id = ${existing.id}`)
  }
}

async function _seedEffects(featureId: number, effects: Effect[]) {
  for (const effect of effects) {
    const existing = await db
      .select()
      .from(schema.effects)
      .where(and(eq(schema.effects.type, effect.type), eq(schema.effects.value, effect.value)))
      .limit(1)
      .get()
    const effectId = existing?.id ?? await db
      .insert(schema.effects)
      .values({ type: effect.type, value: effect.value })
      .returning()
      .get()
      .then(r => r.id)
    await db.insert(schema.featureEffects).values({ featureId, effectId }).onConflictDoNothing()
  }
}
