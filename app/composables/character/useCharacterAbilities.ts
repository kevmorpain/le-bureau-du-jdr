import type { Effect } from '~~/server/db/schema/effects'
import { ABILITY_KEYS, savingThrowKey } from '~~/shared/rules/abilities'
import { computeAbilityScores } from '~~/shared/rules/abilityScores'
import { abilityMod } from '~~/shared/rules/math'
import { savingThrowBonusParts, sumBonusParts, type BonusPart, type EffectSource } from '~~/shared/rules/effectBonuses'
import { ABILITY_SKILLS } from '~~/shared/rules/skills'

// ─── Module-level constants ──────────────────────────────────────────────────

const abilityScoreOrder = ABILITY_KEYS

export const abilitySkillKeys: Record<string, string[]> = ABILITY_SKILLS

export type ProficiencyLevel = 'none' | 'proficient' | 'expert'

const proficiencyPriority: Record<ProficiencyLevel, number> = { none: 0, proficient: 1, expert: 2 }

// Seuls champs de la fiche que lit la couche : le builder y projette son état pour que le récapitulatif
// affiche ce que la fiche affichera (useBuilderSheetProjection).
export interface AbilitiesSheet {
  baseAbilityScores?: { abilityId: string, value: number }[]
  skills?: { skillKey: string, proficiencyLevel: string }[]
  classes?: { level: number }[]
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

  // Pre-computed Map to avoid O(n) filtering on every getEffectiveProficiency call
  const skillProficiencies = computed(() => {
    const map = new Map<string, ProficiencyLevel>()
    for (const s of characterSheet?.value?.skills ?? []) {
      const level = s.proficiencyLevel as ProficiencyLevel
      const current = map.get(s.skillKey)
      if (!current || proficiencyPriority[level] > proficiencyPriority[current]) {
        map.set(s.skillKey, level)
      }
    }
    // `saving_throw_proficiency` est projeté sur la même map via la convention `<carac>_save`.
    // Dérivés (plus matérialisés) : compétences d'historique (`backgroundEffects`), JS de la 1re classe
    // (`classSavingThrowEffects`), maîtrises choisies sur un point de choix (`choiceEffects`).
    const effectSources = [
      ...(deps?.speciesEffects.value ?? []),
      ...(deps?.featureEffects.value ?? []),
      ...(deps?.backgroundEffects?.value ?? []),
      ...(deps?.classSavingThrowEffects?.value ?? []),
      ...(deps?.choiceEffects?.value ?? []),
    ]
    for (const e of effectSources) {
      let key: string | null = null
      if (e.type === 'skill_proficiency') key = e.value.skill
      else if (e.type === 'saving_throw_proficiency') key = savingThrowKey(e.value.ability)
      if (key === null) continue
      if (!map.has(key) || proficiencyPriority['proficient'] > proficiencyPriority[map.get(key)!]) {
        map.set(key, 'proficient')
      }
    }
    return map
  })

  const getEffectiveProficiency = (skillKey: string): ProficiencyLevel =>
    skillProficiencies.value.get(skillKey) ?? 'none'

  const getSkillModifier = (abilityId: string, skillKey: string): number => {
    const base = abilityModifiers.value[abilityId] ?? 0
    const proficiency = getEffectiveProficiency(skillKey)
    const prof = deps?.proficiencyBonus.value ?? 2
    if (proficiency === 'expert') return base + prof * 2
    if (proficiency === 'proficient') return base + prof
    return base
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

  // Bonus rétroactif aux PV max (don Robuste : +2 PV par niveau de personnage).
  // Indépendant des autres calculs de PV — n'est pas persisté dans character_sheets.maxHp.
  const hpBonusFromFeats = computed<number>(() => {
    let perLevel = 0
    for (const e of deps?.featureEffects.value ?? []) {
      if (e.type === 'hp_per_level') perLevel += (e.value as { amount: number }).amount
    }
    if (perLevel === 0) return 0
    const totalLevel = (characterSheet?.value?.classes ?? []).reduce((s, cc) => s + cc.level, 0)
    return perLevel * totalLevel
  })

  const passivePerception = computed(() =>
    10 + getSkillModifier('wis', 'perception') + sumPassiveBonus('perception'),
  )

  const passiveInvestigation = computed(() =>
    10 + getSkillModifier('int', 'investigation') + sumPassiveBonus('investigation'),
  )

  const initiativeBonus = computed<number>(() => (abilityModifiers.value.dex || 0) + initiativeFlatBonus.value)

  return {
    abilityScores,
    abilityModifiers,
    abilitySkillKeys,
    abilityScoreBonuses,
    getEffectiveProficiency,
    getSkillModifier,
    savingThrows,
    savingThrowBonuses,
    passivePerception,
    passiveInvestigation,
    initiativeBonus,
    hpBonusFromFeats,
  }
}
