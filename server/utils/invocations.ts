import { and, eq, inArray } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

// ⚠️ Pas de BEGIN TRANSACTION sur D1 : statements séquentiels + onConflictDoNothing pour l'idempotence.
export async function applyInvocationChanges(
  db: Db,
  characterSheetId: number,
  newInvocationIds: number[],
  replacedInvocationId: number | null,
) {
  if (replacedInvocationId) {
    const grantedSpellNames = await db
      .select({ value: schema.effects.value })
      .from(schema.featureEffects)
      .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
      .where(and(
        eq(schema.featureEffects.featureId, replacedInvocationId),
        eq(schema.effects.type, 'spell_grant'),
      ))

    const spellNamesToRemove = grantedSpellNames
      .map(r => (r.value as { spellName?: string } | null)?.spellName)
      .filter((n): n is string => typeof n === 'string')

    if (spellNamesToRemove.length) {
      const spellsToDelete = await db
        .select({ id: schema.spells.id })
        .from(schema.spells)
        .where(inArray(schema.spells.name, spellNamesToRemove))

      if (spellsToDelete.length) {
        await db
          .delete(schema.characterSpells)
          .where(and(
            eq(schema.characterSpells.characterSheetId, characterSheetId),
            eq(schema.characterSpells.source, 'invocation'),
            inArray(schema.characterSpells.spellId, spellsToDelete.map(s => s.id)),
          ))
      }
    }

    await db
      .delete(schema.characterFeatures)
      .where(and(
        eq(schema.characterFeatures.characterSheetId, characterSheetId),
        eq(schema.characterFeatures.featureId, replacedInvocationId),
      ))
  }

  if (!newInvocationIds.length) return

  await db
    .insert(schema.characterFeatures)
    .values(newInvocationIds.map(featureId => ({
      characterSheetId,
      featureId,
      currentUses: 0,
    })))
    .onConflictDoNothing()

  const grantRows = await db
    .select({
      featureId: schema.featureEffects.featureId,
      value: schema.effects.value,
    })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
    .where(and(
      inArray(schema.featureEffects.featureId, newInvocationIds),
      eq(schema.effects.type, 'spell_grant'),
    ))

  const spellNames = grantRows
    .map(r => (r.value as { spellName?: string } | null)?.spellName)
    .filter((n): n is string => typeof n === 'string')

  if (!spellNames.length) return

  const spellRows = await db
    .select({ id: schema.spells.id, name: schema.spells.name })
    .from(schema.spells)
    .where(inArray(schema.spells.name, spellNames))

  if (!spellRows.length) return

  await db
    .insert(schema.characterSpells)
    .values(spellRows.map(s => ({
      characterSheetId,
      spellId: s.id,
      isKnown: true,
      isPrepared: false,
      source: 'invocation' as const,
    })))
    .onConflictDoNothing()
}
