import { drizzle } from 'drizzle-orm/d1'
import type {
  ExtractTablesWithRelations,
  Many,
  InferSelectModel,
} from 'drizzle-orm'
import * as schema from '../database/schema'

export { sql, eq, and, or } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
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
