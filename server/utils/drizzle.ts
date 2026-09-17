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
 * @deprecated Casse à l'appel (`this.client.prepare is not a function`) : le `db` de `hub:db` est déjà une
 * instance drizzle, le re-wrapper échoue. Utiliser `import { db } from 'hub:db'`.
 */
export function useDrizzle() {
  return drizzle(db, { schema, casing: 'snake_case' })
}

type Schema = typeof schema
type TSchema = ExtractTablesWithRelations<Schema>

type FindTsNameByDbName<DbNameToFind extends string> = {
  [K in keyof TSchema]: TSchema[K] extends { dbName: DbNameToFind } ? K : never
}[keyof TSchema]

type TModelWithRelations<TTableName extends keyof TSchema> = InferSelectModel<
  Schema[TTableName]
> & {
  [K in keyof TSchema[TTableName]['relations']]?: TSchema[TTableName]['relations'][K] extends infer TRelation
    ?
    TRelation extends { referencedTableName: infer TRefDbName extends string }
      ?
      FindTsNameByDbName<TRefDbName> extends infer TRefTsName extends
      keyof TSchema
        ?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        TRelation extends Many<any>
          ? TModelWithRelations<TRefTsName>[]
          : TModelWithRelations<TRefTsName> | null
        : never
      : never
    : never
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
