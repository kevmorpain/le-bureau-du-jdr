import type { Effect } from '~~/server/db/schema/effects'
import { ABILITY_KEYS, savingThrowKey, type AbilityKey } from '~~/shared/rules/abilities'
import { computeAbilityScores } from '~~/shared/rules/abilityScores'
import { abilityMod } from '~~/shared/rules/math'
import { hitPointsPerLevelBonus } from '~~/shared/rules/hitPoints'
import { savingThrowBonusParts, sumBonusParts, type BonusPart, type EffectSource } from '~~/shared/rules/effectBonuses'
import { ABILITY_SKILLS } from '~~/shared/rules/skills'
import { halfProficiencyBonus } from '~~/shared/rules/rolls'
import { proficiencyLevels, type ProficiencyLevel } from '~~/shared/rules/proficiencyLevels'
import type { ProficiencyOverrideRow } from '~~/shared/rules/proficiencyOverrides'

// ─── Module-level constants ──────────────────────────────────────────────────

const abilityScoreOrder = ABILITY_KEYS

export const abilitySkillKeys: Record<string, string[]> = ABILITY_SKILLS

export type { ProficiencyLevel }

// Seuls champs de la fiche que lit la couche : le builder y projette son état pour que le récapitulatif
// affiche ce que la fiche affichera (useBuilderSheetProjection).
export interface AbilitiesSheet {
  baseAbilityScores?: { abilityId: string, value: number }[]
  proficiencyOverrides?: ProficiencyOverrideRow[]
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useCharacterAbilities = (
  characterSheet?: Ref<AbilitiesSheet | null | undefined>,
  deps?: {
    speciesEffects: ComputedRef<Effect[]>
    featureEffects: ComputedRef<Effect[]>
    backgroundEffects?: ComputedRef<Effect[]>
    classSavingThrowEffects?: ComputedRef<Effect[]>
    choiceEffects?: ComputedRef<Effect[]>
    asiEffects: ComputedRef<Effect[]>
    // Effets actifs — objets équipés (et liés quand l'objet l'exige), effets temporaires de la fiche :
    // appliqués au-delà du score naturel. Le libellé de la source sert au détail des bonus.
    activeEffectSources?: ComputedRef<EffectSource[]>
    proficiencyBonus: ComputedRef<number>
  },
) => {
  // ─── Base ability scores ──────────────────────────────────────────────────

  const characterAbilityScores = computed(() =>
    characterSheet?.value?.baseAbilityScores?.reduce<Record<string, number>>((acc, abs) => {
      acc[abs.abilityId] = abs.value
      return acc
    }, {}) || {},
  )

  const activeEffects = computed<Effect[]>(() =>
    (deps?.activeEffectSources?.value ?? []).flatMap(s => s.effects),
  )

  const bonusSources = computed<EffectSource[]>(() => [
    { label: 'Capacités', effects: [...(deps?.speciesEffects.value ?? []), ...(deps?.featureEffects.value ?? [])] },
    ...(deps?.activeEffectSources?.value ?? []),
  ])
  const bonusEffects = computed<Effect[]>(() => bonusSources.value.flatMap(s => s.effects))

  // ─── Computed scores & modifiers ──────────────────────────────────────────

  const abilityScores = computed(() => computeAbilityScores({
    base: characterAbilityScores.value,
    speciesEffects: deps?.speciesEffects.value ?? [],
    featureEffects: deps?.featureEffects.value ?? [],
    asiEffects: deps?.asiEffects.value ?? [],
    activeEffects: activeEffects.value,
  }))

  const abilityScoreBonuses = computed(() => {
    const out: Record<string, number> = {}
    for (const id of abilityScoreOrder) out[id] = abilityScores.value[id]!.bonus
    return out
  })

  const abilityModifiers = computed<Record<string, number>>(() =>
    Object.entries(abilityScores.value).reduce<Record<string, number>>((acc, [key, abilityScore]) => {
      acc[key] = abilityMod(abilityScore.total)
      return acc
    }, {}),
  )

  // ─── Skills & saving throws ───────────────────────────────────────────────

  const skillProficiencies = computed(() => proficiencyLevels(
    [
      ...(deps?.speciesEffects.value ?? []),
      ...(deps?.featureEffects.value ?? []),
      ...(deps?.backgroundEffects?.value ?? []),
      ...(deps?.classSavingThrowEffects?.value ?? []),
      ...(deps?.choiceEffects?.value ?? []),
    ],
    characterSheet?.value?.proficiencyOverrides ?? [],
  ))

  const getEffectiveProficiency = (skillKey: string): ProficiencyLevel =>
    skillProficiencies.value.get(skillKey) ?? 'none'

  const halfProficiency = (abilityId: string): number =>
    halfProficiencyBonus(bonusEffects.value, abilityId as AbilityKey, deps?.proficiencyBonus.value ?? 2)

  // Jet de caractéristique sans compétence : seule la demi-maîtrise (Touche-à-tout, Athlète accompli) s'y ajoute.
  const abilityCheckModifiers = computed<Record<string, number>>(() =>
    Object.fromEntries(abilityScoreOrder.map(id => [id, (abilityModifiers.value[id] ?? 0) + halfProficiency(id)])),
  )

  const getSkillModifier = (abilityId: string, skillKey: string): number => {
    const base = abilityModifiers.value[abilityId] ?? 0
    const proficiency = getEffectiveProficiency(skillKey)
    const prof = deps?.proficiencyBonus.value ?? 2
    if (proficiency === 'expert') return base + prof * 2
    if (proficiency === 'proficient') return base + prof
    return base + halfProficiency(abilityId)
  }

  const savingThrowBonuses = computed<Record<string, BonusPart[]>>(() =>
    Object.fromEntries(abilityScoreOrder.map(abilityId => [abilityId, savingThrowBonusParts(bonusSources.value, abilityId)])),
  )

  const savingThrows = computed(() =>
    Object.fromEntries(
      abilityScoreOrder.map((abilityId) => {
        const saveKey = savingThrowKey(abilityId)
        const proficiency = getEffectiveProficiency(saveKey)
        const base = abilityModifiers.value[abilityId] ?? 0
        const prof = deps?.proficiencyBonus.value ?? 2
        const bonus = sumBonusParts(savingThrowBonuses.value[abilityId] ?? [])
        const modifier = (proficiency !== 'none' ? base + prof : base) + bonus
        return [abilityId, { modifier, proficiency }]
      }),
    ),
  )

  // ─── Bonus issus des dons / effets ───────────────────────────────────────

  const sumPassiveBonus = (skill: 'perception' | 'investigation'): number => {
    let total = 0
    for (const e of bonusEffects.value) {
      if (e.type === 'passive_skill_bonus' && (e.value as { skill: string }).skill === skill) {
        total += (e.value as { amount: number }).amount
      }
    }
    return total
  }

  const initiativeFlatBonus = computed<number>(() => {
    let total = 0
    for (const e of bonusEffects.value) {
      if (e.type === 'initiative_bonus') total += (e.value as { amount: number }).amount
    }
    return total
  })

  // PV par niveau des dons, de l'espèce et des objets (Robuste : +2) : s'ajoutent au maximum à la lecture.
  const hpPerLevelBonus = computed<number>(() => hitPointsPerLevelBonus([
    ...(deps?.speciesEffects.value ?? []),
    ...(deps?.featureEffects.value ?? []),
    ...activeEffects.value,
  ]))

  const passivePerception = computed(() =>
    10 + getSkillModifier('wis', 'perception') + sumPassiveBonus('perception'),
  )

  const passiveInvestigation = computed(() =>
    10 + getSkillModifier('int', 'investigation') + sumPassiveBonus('investigation'),
  )

  const initiativeBonus = computed<number>(() => (abilityCheckModifiers.value.dex || 0) + initiativeFlatBonus.value)

  return {
    abilityScores,
    abilityModifiers,
    abilityCheckModifiers,
    abilitySkillKeys,
    abilityScoreBonuses,
    getEffectiveProficiency,
    getSkillModifier,
    savingThrows,
    savingThrowBonuses,
    passivePerception,
    passiveInvestigation,
    initiativeBonus,
    hpPerLevelBonus,
  }
}
