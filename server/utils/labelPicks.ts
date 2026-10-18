import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import type { ChoiceKind } from '~~/shared/rules/choices'

const LABEL_PICK_KINDS = ['terrain', 'favored_enemy'] as const satisfies readonly ChoiceKind[]

export interface LabelPick {
  featureId: number
  value: string
}

// Les libellés choisis (ennemis jurés, terrains), rattachés à la capacité qui porte le choix : la fiche les affiche dessous,
// et le level-up s'en sert pour ne pas reproposer un ennemi déjà pris.
export async function deriveLabelPicks(db: Db, characterSheetId: number): Promise<LabelPick[]> {
  const rows = await db
    .select({ featureId: schema.progression.featureId, value: schema.characterChoices.selectedValue })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(and(
      eq(schema.characterChoices.characterSheetId, characterSheetId),
      inArray(schema.progression.kind, [...LABEL_PICK_KINDS]),
      isNotNull(schema.characterChoices.selectedValue),
    ))
    .orderBy(asc(schema.characterChoices.id))
  return rows.map(r => ({ featureId: r.featureId, value: r.value! }))
}
