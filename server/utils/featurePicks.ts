import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import type { FeaturePick } from '~~/shared/rules/featurePicks'
import { pactBoonOfName, type PactBoon } from '~~/shared/rules/pactBoon'
import type { ResolvedChoice } from '~~/shared/rules/resolve'
import type { Ruleset } from '~~/shared/rules/ruleset'

export const featurePickSchema = z.object({
  progressionId: z.number().int().positive(),
  featureId: z.number().int().positive(),
})

export async function ownedFeatureIds(db: Db, characterSheetId: number): Promise<Set<number>> {
  const rows = await db
    .select({ featureId: schema.characterFeatures.featureId })
    .from(schema.characterFeatures)
    .where(eq(schema.characterFeatures.characterSheetId, characterSheetId))
  return new Set(rows.map(r => r.featureId))
}

/** Un remplacement porte sur une option que la fiche a choisie sur ce point de choix, non sur une feature qu'elle tient d'ailleurs. */
export async function replacedPickError(db: Db, characterSheetId: number, replacements: Array<z.infer<typeof featurePickSchema>>): Promise<string | null> {
  for (const r of replacements) {
    const [row] = await db
      .select({ id: schema.characterChoices.id })
      .from(schema.characterChoices)
      .where(and(
        eq(schema.characterChoices.characterSheetId, characterSheetId),
        eq(schema.characterChoices.progressionId, r.progressionId),
        eq(schema.characterChoices.selectedFeatureId, r.featureId),
      ))
      .limit(1)
    if (!row) return `L'option remplacée (id=${r.featureId}) n'a pas été choisie sur ce point de choix (id=${r.progressionId}).`
  }
  return null
}

/** Le pacte pris par ces picks, lu dans le nom de l'option choisie ; `null` s'ils n'en portent aucun. */
export async function pickedPactBoon(db: Db, picks: FeaturePick[], choices: ResolvedChoice[]): Promise<PactBoon | null> {
  const pick = picks.find(p => choices.some(c => c.progressionId === p.progressionId && c.kind === 'pact_boon'))
  if (!pick) return null
  const [row] = await db
    .select({ name: schema.features.name })
    .from(schema.features)
    .where(eq(schema.features.id, pick.featureId))
    .limit(1)
  return pactBoonOfName(row?.name)
}

// Les sorts qu'une manifestation octroie sont nommés par ses effets `spell_grant`.
async function spellIdsGrantedBy(db: Db, featureIds: number[], ruleset: Ruleset): Promise<number[]> {
  if (!featureIds.length) return []
  const grants = await db
    .select({ value: schema.effects.value })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
    .where(and(inArray(schema.featureEffects.featureId, featureIds), eq(schema.effects.type, 'spell_grant')))
  const spellNames = grants
    .map(r => (r.value as { spellName?: string } | null)?.spellName)
    .filter((n): n is string => typeof n === 'string')
  if (!spellNames.length) return []
  const spells = await db
    .select({ id: schema.spells.id })
    .from(schema.spells)
    .where(and(inArray(schema.spells.name, spellNames), eq(schema.spells.ruleset, ruleset)))
  return spells.map(s => s.id)
}

interface FeaturePickContext {
  characterSheetId: number
  classId: number
  ruleset: Ruleset
  picks: FeaturePick[]
  replacements?: FeaturePick[]
  choices: ResolvedChoice[]
}

// Un pick est enregistré comme décision (`character_choices`) et matérialisé sur la fiche (`character_features`), pour que
// l'option choisie s'affiche et que ses effets s'appliquent. Les remplacements passent avant les picks : un même lot les écrit
// dans l'ordre, et un sort octroyé par l'ancienne manifestation et la nouvelle reste sur la fiche.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function featurePickStmts(db: Db, ctx: FeaturePickContext): Promise<any[]> {
  const { characterSheetId, classId, ruleset, picks, choices } = ctx
  const replacements = ctx.replacements ?? []
  const ofKind = (list: FeaturePick[], kind: ResolvedChoice['kind']) =>
    list.filter(p => choices.some(c => c.progressionId === p.progressionId && c.kind === kind)).map(p => p.featureId)

  const removedSpellIds = await spellIdsGrantedBy(db, ofKind(replacements, 'invocations'), ruleset)
  const grantedSpellIds = await spellIdsGrantedBy(db, ofKind(picks, 'invocations'), ruleset)

  return [
    ...(removedSpellIds.length
      ? [db.delete(schema.characterSpells).where(and(
          eq(schema.characterSpells.characterSheetId, characterSheetId),
          eq(schema.characterSpells.source, 'invocation'),
          inArray(schema.characterSpells.spellId, removedSpellIds),
        ))]
      : []),
    ...replacements.flatMap(r => [
      db.delete(schema.characterChoices).where(and(
        eq(schema.characterChoices.characterSheetId, characterSheetId),
        eq(schema.characterChoices.progressionId, r.progressionId),
        eq(schema.characterChoices.selectedFeatureId, r.featureId),
      )),
      db.delete(schema.characterFeatures).where(and(
        eq(schema.characterFeatures.characterSheetId, characterSheetId),
        eq(schema.characterFeatures.featureId, r.featureId),
      )),
    ]),
    ...(picks.length
      ? [
          db.insert(schema.characterChoices)
            .values(picks.map(p => ({ characterSheetId, progressionId: p.progressionId, selectedFeatureId: p.featureId })))
            .onConflictDoNothing(),
          db.insert(schema.characterFeatures)
            .values(picks.map(p => ({ characterSheetId, featureId: p.featureId, currentUses: 0 })))
            .onConflictDoNothing(),
        ]
      : []),
    ...(grantedSpellIds.length
      ? [db.insert(schema.characterSpells)
          .values(grantedSpellIds.map(spellId => ({ characterSheetId, spellId, classId, isKnown: true, isPrepared: false, source: 'invocation' as const })))
          .onConflictDoNothing()]
      : []),
  ]
}
