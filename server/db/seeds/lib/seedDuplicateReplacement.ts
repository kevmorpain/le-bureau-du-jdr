import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq, isNull } from 'drizzle-orm'
import * as schema from '../../schema'
import type { ChoiceKind, OptionSource } from '~~/shared/rules/choices'
import type { Formula } from '~~/shared/utils/formula'
import { DUPLICATE_PROFICIENCY_CARRIER_NAME } from '../data/proficiencyCarriers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// Règle générale, sans propriétaire : le nombre de remplacements dus vient du personnage (`duplicate_skills`,
// `duplicate_tools`, cf. `resolveChoices` et `duplicateCount`).
export const DUPLICATE_REPLACEMENT_CHOICES: Array<{ kind: ChoiceKind, count: Formula, optionSource: OptionSource }> = [
  { kind: 'skill', count: { op: 'var', name: 'duplicate_skills' }, optionSource: { type: 'skills', from: 'all' } },
  { kind: 'tool', count: { op: 'var', name: 'duplicate_tools' }, optionSource: { type: 'tools' } },
]

export async function seedDuplicateReplacement(db: Db): Promise<{ progressionsInserted: number }> {
  const existing = await db
    .select({ id: schema.features.id })
    .from(schema.features)
    .where(and(
      eq(schema.features.name, DUPLICATE_PROFICIENCY_CARRIER_NAME),
      eq(schema.features.featureType, 'choice_carrier'),
      isNull(schema.features.classId),
    ))
    .limit(1)
    .get()
  const carrierId = existing?.id
    ?? (await db.insert(schema.features).values({ name: DUPLICATE_PROFICIENCY_CARRIER_NAME, featureType: 'choice_carrier' }).returning().get()).id

  let progressionsInserted = 0
  for (const choice of DUPLICATE_REPLACEMENT_CHOICES) {
    const prog = await db
      .select({ id: schema.progression.id })
      .from(schema.progression)
      .where(and(eq(schema.progression.featureId, carrierId), eq(schema.progression.kind, choice.kind)))
      .limit(1)
      .get()
    if (prog) continue
    await db.insert(schema.progression).values({ featureId: carrierId, ...choice, replaceable: false })
    progressionsInserted++
  }
  return { progressionsInserted }
}
