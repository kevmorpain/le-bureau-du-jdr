import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'

// `null` (choix non persisté) si la classe n'a pas de style, nom inconnu, ou niveau sous le palier d'accès.
export async function resolveFightingStylePick(
  db: Db,
  classId: number,
  styleName: string,
  classLevel: number,
): Promise<{ progressionId: number, featureId: number } | null> {
  const [opt] = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.tag, 'fighting_style'),
      eq(schema.features.classId, classId),
      eq(schema.features.name, styleName),
    ))
    .limit(1)
  if (!opt) return null

  const [prog] = await db
    .select({ id: schema.progression.id, ownerLevel: schema.features.levelRequired })
    .from(schema.progression)
    .innerJoin(schema.features, eq(schema.features.id, schema.progression.featureId))
    .where(and(eq(schema.progression.kind, 'fighting_style'), eq(schema.features.classId, classId)))
    .limit(1)
  if (!prog) return null
  // Le style ne se débloque qu'au palier d'accès (owner.levelRequired) : Guerrier 1, Paladin/Rôdeur 2.
  if ((prog.ownerLevel ?? 1) > classLevel) return null

  return { progressionId: prog.id, featureId: opt.id }
}
