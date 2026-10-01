import type {
  ExtractTablesWithRelations,
  Many,
  InferSelectModel,
} from 'drizzle-orm'
import type * as schema from '../db/schema'

export { sql, eq, and, or } from 'drizzle-orm'

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
export type CharacterSheet = TModelWithRelations<'characterSheets'>
export type EffectRow = typeof schema.effects.$inferSelect
export type { Effect } from '../db/schema/effects'
export type CharacterSpell = typeof schema.characterSpells.$inferSelect
export type Subclass = TModelWithRelations<'subclasses'>
export type Feature = TModelWithRelations<'features'>
