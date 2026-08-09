import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq, ne } from 'drizzle-orm'
import * as schema from '../../schema'
import { DRAGONBORN_LINEAGE_BY_ANCESTRY } from '../data/dragonborn'

/**
 * Migration BESPOKE des fiches Drakéide vivantes vers base + lignée (chantier lignée, D17 — lot 6).
 *
 * Contrairement aux autres espèces, l'ascendance draconique n'était PAS une sous-race mais un choix
 * stocké en COLONNE `character_sheets.dragonborn_ancestry` ('black'…'white'). Il n'existe donc AUCUNE
 * ancienne espèce homonyme d'une lignée → le moteur générique `migrateLineageSheets` (résolution par
 * nom d'espèce) ne s'applique pas. Ici : pour chaque fiche pointant l'espèce LEGACY « Drakéide (2014) »
 * (renommée par la migration 0088), on lit sa colonne d'ascendance, on la mappe à la lignée
 * « Dragon <couleur> » (via `DRAGONBORN_LINEAGE_BY_ANCESTRY`), on pose le `character_choices` et on
 * repointe `species_id` → base « Drakéide ». La colonne est CONSERVÉE (vestige inoffensif).
 *
 * **Idempotent + rejouable** (aucun flag temporaire) : une fiche migrée pointe la base → invisible au
 * balayage ; le choix est inséré sous garde `NOT EXISTS`. Séquentiel, jamais `db.transaction()` (D14).
 * Échafaudage temporaire du rollout — à retirer une fois toutes les espèces basculées.
 *
 * `db` INJECTÉ (patron des utils lot 5/6), lecture/écriture via le schéma FRAIS (`../../schema`).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export interface DragonbornMigrationReport {
  migrated: number
  choicesInserted: number
  byLineage: Record<string, number>
  skipped: string[]
}

export async function migrateDragonbornLineage(
  db: Db,
  baseName = 'Drakéide',
  legacyName = 'Drakéide (2014)',
): Promise<DragonbornMigrationReport> {
  const report: DragonbornMigrationReport = { migrated: 0, choicesInserted: 0, byLineage: {}, skipped: [] }

  const bases = await db
    .select()
    .from(schema.characterSpecies)
    .where(eq(schema.characterSpecies.name, baseName))

  for (const base of bases) {
    const lineages = await db
      .select()
      .from(schema.speciesLineages)
      .where(eq(schema.speciesLineages.speciesId, base.id))
    if (!lineages.length) continue // pas une base (structure non seedée) → ignorer
    const lineageIdByName = new Map(lineages.map(l => [l.name, l.id]))

    // Progression « lignée » portée par une feature d'espèce de cette base.
    const baseFeatureIds = (await db
      .select({ featureId: schema.speciesFeatures.featureId })
      .from(schema.speciesFeatures)
      .where(eq(schema.speciesFeatures.speciesId, base.id)))
      .map(r => r.featureId)
    const prog = baseFeatureIds.length
      ? await db
          .select()
          .from(schema.progression)
          .where(eq(schema.progression.kind, 'lineage'))
          .then(rows => rows.find(p => baseFeatureIds.includes(p.featureId)))
      : undefined
    if (!prog) {
      report.skipped.push(`${baseName} (${base.ruleset}) : point de choix « lignée » absent — seeder la structure d'abord`)
      continue
    }

    // Espèce legacy « Drakéide (2014) » de MÊME ruleset (≠ base).
    const legacy = await db
      .select()
      .from(schema.characterSpecies)
      .where(and(
        eq(schema.characterSpecies.name, legacyName),
        eq(schema.characterSpecies.ruleset, base.ruleset),
        ne(schema.characterSpecies.id, base.id),
      ))
      .limit(1)
      .get()
    if (!legacy) continue // legacy déjà retirée / inexistante → rien à migrer

    const sheets = await db
      .select({ id: schema.characterSheets.id, ancestry: schema.characterSheets.dragonbornAncestry })
      .from(schema.characterSheets)
      .where(eq(schema.characterSheets.speciesId, legacy.id))

    for (const sheet of sheets) {
      const lineageName = sheet.ancestry ? DRAGONBORN_LINEAGE_BY_ANCESTRY[sheet.ancestry] : undefined
      const lineageId = lineageName ? lineageIdByName.get(lineageName) : undefined
      if (lineageId == null) {
        // Ascendance NULL ou inconnue → on ne peut pas déterminer la lignée : on laisse la fiche sur
        // la legacy (elle rend toujours via la colonne, comportement inchangé).
        report.skipped.push(`fiche ${sheet.id} : ascendance « ${sheet.ancestry ?? 'aucune'} » non mappable`)
        continue
      }

      const existingChoice = await db
        .select({ id: schema.characterChoices.id })
        .from(schema.characterChoices)
        .where(and(
          eq(schema.characterChoices.characterSheetId, sheet.id),
          eq(schema.characterChoices.progressionId, prog.id),
          eq(schema.characterChoices.selectedLineageId, lineageId),
        ))
        .limit(1)
        .get()
      if (!existingChoice) {
        await db.insert(schema.characterChoices).values({
          characterSheetId: sheet.id,
          progressionId: prog.id,
          selectedLineageId: lineageId,
        })
        report.choicesInserted++
      }

      await db
        .update(schema.characterSheets)
        .set({ speciesId: base.id, updatedAt: new Date().toISOString() })
        .where(eq(schema.characterSheets.id, sheet.id))

      report.migrated++
      report.byLineage[lineageName!] = (report.byLineage[lineageName!] ?? 0) + 1
    }
  }

  return report
}
