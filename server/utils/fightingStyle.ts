import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/**
 * Résout le pick de STYLE DE COMBAT d'une classe (F2 tranche 2) : la progression
 * `kind:'fighting_style'` de la classe + la feature-option choisie (par NOM, tag `fighting_style`,
 * même classe). Le front envoie le nom du style (« Défense »…) ; on le résout en feature pour
 * écrire `character_choices` (source) + matérialiser l'option (comme les invocations/la métamagie).
 *
 * Rend `null` si la classe n'a pas de progression de style (défensif : classe non martiale, ou
 * structure pas seedée), si le nom est inconnu, ou si le niveau dans la classe est SOUS le palier
 * d'accès au style (autorité serveur : un Paladin niv 1 n'a pas encore de style, même si le front
 * l'envoie). Dans tous ces cas le choix n'est pas persisté, sans casser la création/montée. `db`
 * INJECTÉ (D1 en prod, libsql en test) ; les écritures sont faites par l'appelant DANS son
 * `db.batch()` atomique — symétrique du choix de sous-classe.
 */
export async function resolveFightingStylePick(
  db: Db,
  classId: number,
  styleName: string,
  classLevel: number,
): Promise<{ progressionId: number, featureId: number } | null> {
  const [opt] = await db
    .select({ id: srcSchema.features.id })
    .from(srcSchema.features)
    .where(and(
      eq(srcSchema.features.tag, 'fighting_style'),
      eq(srcSchema.features.classId, classId),
      eq(srcSchema.features.name, styleName),
    ))
    .limit(1)
  if (!opt) return null

  const [prog] = await db
    .select({ id: srcSchema.progression.id, ownerLevel: srcSchema.features.levelRequired })
    .from(srcSchema.progression)
    .innerJoin(srcSchema.features, eq(srcSchema.features.id, srcSchema.progression.featureId))
    .where(and(eq(srcSchema.progression.kind, 'fighting_style'), eq(srcSchema.features.classId, classId)))
    .limit(1)
  if (!prog) return null
  // Le style ne se débloque qu'au palier d'accès (owner.levelRequired) : Guerrier 1, Paladin/Rôdeur 2.
  if ((prog.ownerLevel ?? 1) > classLevel) return null

  return { progressionId: prog.id, featureId: opt.id }
}
