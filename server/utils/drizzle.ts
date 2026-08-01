import { drizzle } from 'drizzle-orm/d1'
import type {
  ExtractTablesWithRelations,
  Many,
  InferSelectModel,
} from 'drizzle-orm'
import * as schema from '../db/schema'
import { db } from 'hub:db'

export { sql, eq, and, or } from 'drizzle-orm'

export const tables = schema

/**
 * @deprecated ⚠️ NE PAS UTILISER — casse à l'appel : `this.client.prepare is not a function`.
 * `@nuxthub/db` (que ré-exporte `hub:db`) construit DÉJÀ `db = drizzle(binding, …)` de `drizzle-orm/d1`
 * (cf. node_modules/@nuxthub/db/db.mjs) : le `db` exporté est une instance `DrizzleD1Database`, PAS le
 * binding brut. `useDrizzle()` la re-wrappe (`drizzle(db)`) → la session D1 appelle `this.client.prepare`
 * sur une instance drizzle qui n'a pas `.prepare()` → crash. C'est le même `db.mjs` en dev ET en prod
 * (seul le `binding` sous-jacent change) → cassé dans les deux, indépendamment de l'édition. Le helper
 * est resté « contourné » (rules-engine.md §7) : personne ne l'appelle. Pour accéder à la base :
 * `import { db } from 'hub:db'` directement (au besoin `db as any` pour un util à `db` injecté, cf.
 * server/utils/catalog.ts, catalogSources.ts, characterCreate.ts…). Un `useDrizzle()` CORRECT devrait
 * wrapper le BINDING brut (`globalThis.DB`), pas le `db` déjà-drizzle de `hub:db`.
 */
export function useDrizzle() {
  return drizzle(db, { schema, casing: 'snake_case' })
}

type Schema = typeof schema
type TSchema = ExtractTablesWithRelations<Schema>

// Helper type to find the tsName corresponding to a given dbName in TSchema
type FindTsNameByDbName<DbNameToFind extends string> = {
  [K in keyof TSchema]: TSchema[K] extends { dbName: DbNameToFind } ? K : never
}[keyof TSchema]

/**
 * Utility type to infer the model type for a given table name from the schema.
 * Handles nested relations recursively.
 * Uses referencedTableName (dbName) and FindTsNameByDbName helper.
 */
type TModelWithRelations<TTableName extends keyof TSchema> = InferSelectModel<
  Schema[TTableName]
> & {
  [K in keyof TSchema[TTableName]['relations']]?: TSchema[TTableName]['relations'][K] extends infer TRelation // Infer the Relation/Many type
    ? // Extract the dbName from the relation's referencedTableName property
    TRelation extends { referencedTableName: infer TRefDbName extends string }
      ? // Find the corresponding tsName using the helper
      FindTsNameByDbName<TRefDbName> extends infer TRefTsName extends
      keyof TSchema
        ? // Check if the original relation was Many or Relation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TRelation extends Many<any>
          ? TModelWithRelations<TRefTsName>[] // Use the found tsName for recursion (Array)
          : TModelWithRelations<TRefTsName> | null // Use the found tsName for recursion (Single | null)
        : never // Could not find a tsName for the given dbName
      : never // Could not extract referencedTableName (dbName)
    : never // Could not infer TRelation
}

export type AbilityScore = typeof schema.abilityScores.$inferSelect
export type DamageType = typeof schema.damageTypes.$inferSelect
export type MagicSchool = typeof schema.magicSchools.$inferSelect
export type Spell = TModelWithRelations<'spells'>
export type InsertSpell = typeof schema.spells.$inferInsert
export type CharacterSpecies = TModelWithRelations<'characterSpecies'>
export type CharacterSheet = TModelWithRelations<'characterSheets'>
export type InsertCharacterSheet = typeof schema.characterSheets.$inferInsert
export type CharacterClass = TModelWithRelations<'characterClasses'>
export type InsertCharacterClass = typeof schema.characterClasses.$inferInsert
export type ClassItem = typeof schema.classes.$inferSelect
export type CharacterAbilityScore = TModelWithRelations<'characterAbilityScores'>
export type InsertCharacterAbilityScore = typeof schema.characterAbilityScores.$inferInsert
export type EffectRow = typeof schema.effects.$inferSelect
export type { Effect } from '../db/schema/effects'
export type FeatureEffect = TModelWithRelations<'featureEffects'>
export type SpeciesFeature = TModelWithRelations<'speciesFeatures'>
export type CharacterSpell = typeof schema.characterSpells.$inferSelect
export type InsertCharacterSpell = typeof schema.characterSpells.$inferInsert
export type CharacterSpellSlot = typeof schema.characterSpellSlots.$inferSelect
export type InsertCharacterSpellSlot = typeof schema.characterSpellSlots.$inferInsert
export type CharacterSkill = typeof schema.characterSkills.$inferSelect
export type InsertCharacterSkill = typeof schema.characterSkills.$inferInsert
export type Subclass = TModelWithRelations<'subclasses'>
export type Feature = TModelWithRelations<'features'>
export type InsertFeature = typeof schema.features.$inferInsert
export type CharacterFeature = TModelWithRelations<'characterFeatures'>
export type InsertCharacterFeature = typeof schema.characterFeatures.$inferInsert
