import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import { PACT_BOON_NAMES, type PactBoon } from '~~/shared/rules/pactBoon'

// `null` si la classe n'a pas cette option de pacte au catalogue.
export async function resolvePactBoonFeatureId(db: Db, classId: number, pactBoon: PactBoon): Promise<number | null> {
  const [opt] = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.tag, 'pact_boon'),
      eq(schema.features.classId, classId),
      eq(schema.features.name, PACT_BOON_NAMES[pactBoon]),
    ))
    .limit(1)
  return opt?.id ?? null
}
