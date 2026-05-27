import { db } from 'hub:db'
import * as srcSchema from '~~/server/db/schema'
import { and, eq, inArray } from 'drizzle-orm'

// Applique l'ajout / remplacement d'invocations occultes pour un personnage.
// - newInvocationIds : invocations à apprendre
// - replacedInvocationId : invocation existante à retirer (avec ses spell_grants)
//
// ⚠️ D1 (Cloudflare) ne supporte pas BEGIN TRANSACTION en SQL brut — on enchaîne
//    des statements séquentiels avec onConflictDoNothing pour l'idempotence.
export async function applyInvocationChanges(
  characterSheetId: number,
  newInvocationIds: number[],
  replacedInvocationId: number | null,
) {
  // 1. Remplacement : supprimer l'invocation existante + ses sorts octroyés
  if (replacedInvocationId) {
    const grantedSpellNames = await db
      .select({ value: srcSchema.effects.value })
      .from(srcSchema.featureEffects)
      .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
      .where(and(
        eq(srcSchema.featureEffects.featureId, replacedInvocationId),
        eq(srcSchema.effects.type, 'spell_grant'),
      ))

    const spellNamesToRemove = grantedSpellNames
      .map(r => (r.value as any)?.spellName)
      .filter((n): n is string => typeof n === 'string')

    if (spellNamesToRemove.length) {
      const spellsToDelete = await db
        .select({ id: srcSchema.spells.id })
        .from(srcSchema.spells)
        .where(inArray(srcSchema.spells.name, spellNamesToRemove))

      if (spellsToDelete.length) {
        await db
          .delete(srcSchema.characterSpells)
          .where(and(
            eq(srcSchema.characterSpells.characterSheetId, characterSheetId),
            eq(srcSchema.characterSpells.source, 'invocation'),
            inArray(srcSchema.characterSpells.spellId, spellsToDelete.map(s => s.id)),
          ))
      }
    }

    await db
      .delete(srcSchema.characterFeatures)
      .where(and(
        eq(srcSchema.characterFeatures.characterSheetId, characterSheetId),
        eq(srcSchema.characterFeatures.featureId, replacedInvocationId),
      ))
  }

  // 2. Insertion des nouvelles invocations
  if (!newInvocationIds.length) return

  await db
    .insert(srcSchema.characterFeatures)
    .values(newInvocationIds.map(featureId => ({
      characterSheetId,
      featureId,
      currentUses: 0,
    })))
    .onConflictDoNothing()

  // 3. Matérialiser les spell_grant en character_spells (source='invocation')
  const grantRows = await db
    .select({
      featureId: srcSchema.featureEffects.featureId,
      value: srcSchema.effects.value,
    })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(and(
      inArray(srcSchema.featureEffects.featureId, newInvocationIds),
      eq(srcSchema.effects.type, 'spell_grant'),
    ))

  const spellNames = grantRows
    .map(r => (r.value as any)?.spellName)
    .filter((n): n is string => typeof n === 'string')

  if (!spellNames.length) return

  const spellRows = await db
    .select({ id: srcSchema.spells.id, name: srcSchema.spells.name })
    .from(srcSchema.spells)
    .where(inArray(srcSchema.spells.name, spellNames))

  if (!spellRows.length) return

  await db
    .insert(srcSchema.characterSpells)
    .values(spellRows.map(s => ({
      characterSheetId,
      spellId: s.id,
      isKnown: true,
      isPrepared: false,
      source: 'invocation' as const,
    })))
    .onConflictDoNothing()
}
