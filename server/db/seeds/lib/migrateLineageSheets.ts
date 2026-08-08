import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq, ne } from 'drizzle-orm'
import * as schema from '../../schema'

/**
 * Migration des fiches VIVANTES vers le modèle « base + lignée » (chantier lignée, D17 — lot 4).
 *
 * Une fiche créée avant la bascule pointe une ANCIENNE espèce séparée (Haut-elfe, Elfe des bois,
 * Elfe noir…). Ce util la fait passer au modèle unifié : `species_id` → l'espèce de BASE, plus une
 * ligne `character_choices` qui enregistre la lignée choisie (la lignée HOMONYME de l'ancienne
 * espèce). Dès lors, la fiche dérive base ⊕ lignée = exactement les anciens effets (équivalence
 * D12, déjà prouvée par `lineageDerivation.test.ts` ; la dérivation elle-même est en prod, lot 3b-2).
 *
 * **Générique, piloté par une liste** (`LINEAGE_MIGRATION_BASES`) : le moteur ne code EN DUR ni
 * l'elfe ni le moindre id. Il résout tout **par nom + ruleset** (les ids prod sont inconnus) :
 *   - l'espèce de base par son nom ;
 *   - son point de choix « lignée » (`progression kind:'lineage'` porté par une de ses
 *     `species_features`) ;
 *   - pour chaque `species_lineages` de la base, l'ancienne espèce homonyme de MÊME ruleset.
 * Au rollout (lot 6), migrer Nain/Halfelin/… = ajouter leur nom à la liste, sans toucher le moteur.
 *
 * **Idempotent + rejouable** (aucune colonne/flag temporaire) : une fiche déjà migrée pointe la
 * base (plus l'ancienne espèce) → invisible au balayage ; le choix est inséré sous garde
 * `NOT EXISTS` (l'index unique `character_choices_unique` ne bloque PAS les doublons — NULL
 * distincts en SQLite, cf. species_lineages schema). **Rejouer après une bascule builder (lot 5)
 * balaie les fiches créées entre-temps.** Additif : n'efface AUCUNE ancienne espèce (retrait au
 * lot 5/6, quand le builder ne les résout plus).
 *
 * `db` est INJECTÉ (patron des utils lot 5/6) : le `db` de `hub:db` en prod via le wrapper
 * `migrate_lineages.ts`, une instance libsql en test. Lecture/écriture via le schéma FRAIS
 * (`../../schema`), jamais le cache `hub:db` (colonnes/tables neuves garanties, cf. CLAUDE.md).
 * Statements séquentiels, jamais `db.transaction()` (D1 rejette BEGIN, D14).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Espèces de BASE à migrer, par nom. Pilote = Elfe seul ; rollout (lot 6) = ajouter des noms. */
export const LINEAGE_MIGRATION_BASES = ['Elfe'] as const

export interface LineageMigrationReport {
  /** Fiches repointées vers une espèce de base. */
  migrated: number
  /** Lignes `character_choices` créées (peut être < migrated si des choix préexistaient). */
  choicesInserted: number
  /** Détail par nom de lignée. */
  byLineage: Record<string, number>
  /** Bases ignorées et pourquoi (structure non seedée, etc.). */
  skipped: string[]
}

export async function migrateLineageSheets(
  db: Db,
  baseNames: readonly string[] = LINEAGE_MIGRATION_BASES,
): Promise<LineageMigrationReport> {
  const report: LineageMigrationReport = { migrated: 0, choicesInserted: 0, byLineage: {}, skipped: [] }

  for (const baseName of baseNames) {
    // 1. Espèce(s) de base par nom. Une base ne compte que si elle porte des lignées (sinon c'est
    //    encore une ancienne espèce séparée, pas une base). On traite chaque édition séparément :
    //    le ruleset de la base fait autorité pour retrouver les anciennes espèces homonymes.
    const bases = await db
      .select()
      .from(schema.characterSpecies)
      .where(eq(schema.characterSpecies.name, baseName))

    for (const base of bases) {
      const lineages = await db
        .select()
        .from(schema.speciesLineages)
        .where(eq(schema.speciesLineages.speciesId, base.id))
      if (!lineages.length) continue // pas une base (aucune lignée) → ignorer silencieusement

      // 2. Point de choix « lignée » : une progression kind:'lineage' portée par une feature
      //    d'espèce de cette base.
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

      // 3. Pour chaque lignée, l'ancienne espèce homonyme de MÊME ruleset (différente de la base).
      for (const lineage of lineages) {
        const legacy = await db
          .select()
          .from(schema.characterSpecies)
          .where(and(
            eq(schema.characterSpecies.name, lineage.name),
            eq(schema.characterSpecies.ruleset, base.ruleset),
            ne(schema.characterSpecies.id, base.id),
          ))
          .limit(1)
          .get()
        if (!legacy) continue // ancienne espèce déjà retirée / inexistante → rien à migrer

        const sheets = await db
          .select({ id: schema.characterSheets.id })
          .from(schema.characterSheets)
          .where(eq(schema.characterSheets.speciesId, legacy.id))

        for (const sheet of sheets) {
          // Choix de lignée (idempotent : NOT EXISTS applicatif).
          const existingChoice = await db
            .select({ id: schema.characterChoices.id })
            .from(schema.characterChoices)
            .where(and(
              eq(schema.characterChoices.characterSheetId, sheet.id),
              eq(schema.characterChoices.progressionId, prog.id),
              eq(schema.characterChoices.selectedLineageId, lineage.id),
            ))
            .limit(1)
            .get()
          if (!existingChoice) {
            await db.insert(schema.characterChoices).values({
              characterSheetId: sheet.id,
              progressionId: prog.id,
              selectedLineageId: lineage.id,
            })
            report.choicesInserted++
          }

          // Repointage de l'espèce → base.
          await db
            .update(schema.characterSheets)
            .set({ speciesId: base.id, updatedAt: new Date().toISOString() })
            .where(eq(schema.characterSheets.id, sheet.id))

          report.migrated++
          report.byLineage[lineage.name] = (report.byLineage[lineage.name] ?? 0) + 1
        }
      }
    }
  }

  return report
}
