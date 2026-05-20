import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import type { Effect } from '../../schema/effects'
import type { FeatureType, ActionType, RechargeType, FeatureMeta } from '../../schema/features'
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
    const { effects = [], meta, ...data } = featureDef
    const existing = await db.query.features.findFirst({
      where: and(eq(schema.features.classId, cls.id), eq(schema.features.name, data.name)),
    })
    let feature
    if (existing) {
      feature = existing
      // Resync meta on existing features when seed defines it
      if (meta !== undefined && meta !== null && JSON.stringify(existing.meta) !== JSON.stringify(meta)) {
        await db.run(sql`UPDATE features SET meta = ${JSON.stringify(meta)} WHERE id = ${existing.id}`)
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
        })
        .returning()
        .get()
      featuresInserted++
    }
    await _seedEffects(feature.id, effects as Effect[])
  }

  for (const subclassDef of subclassDefs) {
    const existingSubclass = await db.query.subclasses.findFirst({
      where: and(eq(schema.subclasses.classId, cls.id), eq(schema.subclasses.name, subclassDef.name)),
    })
    let subclass
    if (existingSubclass) {
      subclass = existingSubclass
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
      const { effects = [], meta, ...data } = featureDef
      const existing = await db.query.features.findFirst({
        where: and(eq(schema.features.subclassId, subclass.id), eq(schema.features.name, data.name)),
      })
      let feature
      if (existing) {
        feature = existing
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
      await _seedEffects(feature.id, effects as Effect[])
    }
  }

  return { featuresInserted, subclassesInserted }
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
