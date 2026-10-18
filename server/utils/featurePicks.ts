import { eq } from 'drizzle-orm'
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
