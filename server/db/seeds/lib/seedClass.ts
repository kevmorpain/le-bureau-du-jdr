import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import type { Effect } from '../../schema/effects'
import type { FeatureType, ActionType, RechargeType, FeatureMeta, FeaturePrerequisite } from '../../schema/features'
import type { FeatureTag } from '~~/shared/rules/featureTags'
import type { Formula } from '~~/shared/utils/formula'

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
  // Groupe de features-options auquel cette feature appartient (cf.
  // shared/rules/featureTags.ts). Renseigné pour les invocations ; les autres
  // groupes suivront au lot 4c. La migration 0081 fait le même backfill côté
  // bases déjà déployées.
  tag?: FeatureTag | null
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
): Promise<{ featuresInserted: number; subclassesInserted: number }> {
  let featuresInserted = 0
  let subclassesInserted = 0

  const cls = await db.query.classes.findFirst({ where: eq(schema.classes.name, className) })
  if (!cls) {
    console.warn(`[seedClass] Classe "${className}" introuvable — skip`)
    return { featuresInserted, subclassesInserted }
  }

  for (const featureDef of baseFeatures) {
    const { effects = [], meta, prerequisites, tag, ...data } = featureDef
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
      // Resync le contenu mutable (description + mécaniques) sur les features
      // existantes : le seed est la source de vérité du contenu, donc un seed
      // corrigé doit pouvoir mettre à jour une base déjà peuplée.
      await _resyncFeatureContent(existing, data)
      // Resync meta on existing features when seed defines it
      if (meta !== undefined && meta !== null && JSON.stringify(existing.meta) !== JSON.stringify(meta)) {
        await db.run(sql`UPDATE features SET meta = ${JSON.stringify(meta)} WHERE id = ${existing.id}`)
      }
      // Resync prerequisites on existing features when seed defines it
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
    await _seedEffects(feature.id, effects as Effect[])
  }

  for (const subclassDef of subclassDefs) {
    const existingSubclass = await db.query.subclasses.findFirst({
      where: and(eq(schema.subclasses.classId, cls.id), eq(schema.subclasses.name, subclassDef.name)),
    })
    let subclass
    if (existingSubclass) {
      subclass = existingSubclass
      // Resync la description sur les sous-classes existantes (source de vérité = seed)
      const seedDesc = subclassDef.description ?? null
      if (existingSubclass.description !== seedDesc) {
        await db.run(sql`UPDATE subclasses SET description = ${seedDesc} WHERE id = ${existingSubclass.id}`)
      }
      // Resync spellcastingAbility on existing subclasses when seed defines it
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
      const { effects = [], meta, tag, ...data } = featureDef
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
      await _seedEffects(feature.id, effects as Effect[])
    }
  }

  return { featuresInserted, subclassesInserted }
}

/**
 * Écrit le `tag` (feature_group) d'une feature. `undefined` = le seed ne se prononce
 * pas (on laisse le tag existant). Écriture par `sql` brut — comme meta/prerequisites
 * ci-dessus — pour être robuste au cache de schéma de `hub:db`, potentiellement
 * périmé après l'ajout de la colonne (cf. CLAUDE.md « hub:db schema cache » et le
 * précédent des colonnes d'identité de `classes` au lot 4a).
 */
async function _syncFeatureTag(featureId: number, tag: FeatureTag | null | undefined) {
  if (tag === undefined) return
  await db.run(sql`UPDATE features SET tag = ${tag ?? null} WHERE id = ${featureId}`)
}

/**
 * Met à jour le contenu mutable d'une feature existante pour qu'il colle au seed
 * (description + mécaniques : type d'action, recharge, formule d'utilisations).
 * Le nom et le niveau servent de clef d'identité (gérés en amont via migration),
 * ils ne sont donc pas touchés ici. N'écrit qu'en cas de différence.
 */
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
