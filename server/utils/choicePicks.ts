import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { z } from 'zod'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import { PICK_CHOICE_KINDS, SPELL_CHOICE_KINDS, VALUE_CHOICE_KINDS, type ChoiceKind } from '~~/shared/rules/choices'
import type { ResolvedChoice } from '~~/shared/rules/resolve'
import type { SkillKey } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export const choicePickSchema = z.object({
  progressionId: z.number().int().positive(),
  value: z.string().min(1).optional(),
  spellId: z.number().int().positive().optional(),
}).refine(p => (p.value == null) !== (p.spellId == null), 'Un choix porte soit une valeur, soit un sort.')

export type ChoicePick = z.infer<typeof choicePickSchema>

/** Premier pick illégal pour ce personnage, ou `null`. Le résultat de `resolveChoices` fait autorité. */
export function choicePicksError(picks: ChoicePick[], choices: ResolvedChoice[]): string | null {
  const byProgression = new Map<number, ChoicePick[]>()
  for (const pick of picks) byProgression.set(pick.progressionId, [...(byProgression.get(pick.progressionId) ?? []), pick])

  for (const [progressionId, group] of byProgression) {
    const choice = choices.find(c => c.progressionId === progressionId)
    if (!choice || !PICK_CHOICE_KINDS.includes(choice.kind)) return `Le point de choix (id=${progressionId}) n'est pas proposé à ce personnage.`
    if (group.length > choice.remaining) return `Trop de choix pour le point de choix (id=${progressionId}) : ${group.length} pour ${choice.remaining} restant(s).`

    const isSpell = (SPELL_CHOICE_KINDS as readonly ChoiceKind[]).includes(choice.kind)
    const picked = group.map(p => isSpell ? p.spellId : p.value)
    if (picked.some(v => v == null)) return `Le point de choix (id=${progressionId}) attend ${isSpell ? 'un sort' : 'une valeur'}.`
    if (new Set(picked).size !== picked.length) return `Le même choix est fait deux fois (point de choix id=${progressionId}).`
    const allowed = new Set(choice.options.map(o => isSpell ? o.spellId : o.value))
    const bad = picked.find(v => !allowed.has(v))
    if (bad != null) return `« ${bad} » n'est pas une option du point de choix (id=${progressionId}).`
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function choicePickWriteStmts(db: Db, characterSheetId: number, picks: ChoicePick[]): any[] {
  if (!picks.length) return []
  return [db.insert(srcSchema.characterChoices)
    .values(picks.map(p => ({
      characterSheetId,
      progressionId: p.progressionId,
      selectedValue: p.value ?? null,
      selectedSpellId: p.spellId ?? null,
    })))
    .onConflictDoNothing()]
}

const PROFICIENCY_EFFECT_BY_KIND = {
  skill: (value: string): Effect => ({ type: 'skill_proficiency', value: { skill: value as SkillKey } }),
  tool: (value: string): Effect => ({ type: 'tool_proficiency', value }),
  language: (value: string): Effect => ({ type: 'language_proficiency', value }),
} satisfies Record<(typeof VALUE_CHOICE_KINDS)[number], (value: string) => Effect>

// Maîtrises choisies (compétences, outils, langues), quel que soit le propriétaire du point de choix : le pick
// est la seule donnée stockée, la maîtrise est produite ici à chaque lecture.
export async function deriveChoiceProficiencies(db: Db, characterSheetId: number): Promise<Effect[]> {
  const rows = await db
    .select({ kind: srcSchema.progression.kind, value: srcSchema.characterChoices.selectedValue })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      inArray(srcSchema.progression.kind, [...VALUE_CHOICE_KINDS]),
      isNotNull(srcSchema.characterChoices.selectedValue),
    ))
  return rows.map(r => PROFICIENCY_EFFECT_BY_KIND[r.kind as keyof typeof PROFICIENCY_EFFECT_BY_KIND](r.value!))
}
