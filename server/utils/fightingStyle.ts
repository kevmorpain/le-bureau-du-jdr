import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// `null` (choix non persisté) si la classe n'a pas de style, nom inconnu, ou niveau sous le palier d'accès.
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
