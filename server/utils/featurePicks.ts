import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

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

// Les remplacements passent avant les picks : un même lot les écrit dans l'ordre.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featureReplacementStmts(db: Db, characterSheetId: number, replacements: Array<z.infer<typeof featurePickSchema>>): any[] {
  return replacements.flatMap(r => [
    db.delete(schema.characterChoices).where(and(
      eq(schema.characterChoices.characterSheetId, characterSheetId),
      eq(schema.characterChoices.progressionId, r.progressionId),
      eq(schema.characterChoices.selectedFeatureId, r.featureId),
    )),
    db.delete(schema.characterFeatures).where(and(
      eq(schema.characterFeatures.characterSheetId, characterSheetId),
      eq(schema.characterFeatures.featureId, r.featureId),
    )),
  ])
}

// Un pick est enregistré comme décision (`character_choices`) et matérialisé sur la fiche (`character_features`), pour que
// l'option choisie s'affiche et que ses effets s'appliquent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function featurePickWriteStmts(db: Db, characterSheetId: number, picks: Array<z.infer<typeof featurePickSchema>>): any[] {
  if (!picks.length) return []
  return [
    db.insert(schema.characterChoices)
      .values(picks.map(p => ({ characterSheetId, progressionId: p.progressionId, selectedFeatureId: p.featureId })))
      .onConflictDoNothing(),
    db.insert(schema.characterFeatures)
      .values(picks.map(p => ({ characterSheetId, featureId: p.featureId, currentUses: 0 })))
      .onConflictDoNothing(),
  ]
}
