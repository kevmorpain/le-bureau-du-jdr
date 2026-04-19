import type { Effect } from '~~/server/db/schema/effects'

// ─── Module-level constants ──────────────────────────────────────────────────

const abilityScoreOrder = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export const abilitySkillKeys: Record<string, string[]> = {
  str: ['athletics'],
  dex: ['acrobatics', 'sleight_of_hand', 'stealth'],
  con: [],
  int: ['arcana', 'history', 'investigation', 'nature', 'religion'],
  wis: ['animal_handling', 'insight', 'medicine', 'perception', 'survival'],
  cha: ['deception', 'intimidation', 'performance', 'persuasion'],
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useCharacterAbilities = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    speciesEffects: ComputedRef<Effect[]>
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

  const getAbilityScore = (abilityId: string): number =>
    characterAbilityScores.value[abilityId] || 10

  // ─── Species bonuses ──────────────────────────────────────────────────────

  const speciesAbilityScoreBonuses = computed(() => {
    const bonuses: Record<string, number> = {}
    const effects = deps?.speciesEffects.value ?? []

    effects.forEach((effect) => {
      if (effect.type === 'ability_increase') {
        const { ability, amount } = effect.value
        bonuses[ability] = (bonuses[ability] ?? 0) + amount
      }
    })

    return bonuses
  })

  // ─── Computed scores & modifiers ──────────────────────────────────────────

  // TODO: should be total with all bonuses
  const abilityScores = computed<Record<string, { base: number, speciesBonus: number, total: number }>>(() =>
    abilityScoreOrder.reduce<Record<string, { base: number, speciesBonus: number, total: number }>>((acc, abilityId) => {
      const base = getAbilityScore(abilityId)
      const speciesBonus = speciesAbilityScoreBonuses.value[abilityId] || 0
      acc[abilityId] = { base, speciesBonus, total: base + speciesBonus }
      return acc
    }, {}),
  )

  const abilityModifiers = computed<Record<string, number>>(() =>
    Object.entries(abilityScores.value).reduce<Record<string, number>>((acc, [key, abilityScore]) => {
      acc[key] = Math.floor((abilityScore.total - 10) / 2)
      return acc
    }, {}),
  )

  // ─── Skills & saving throws ───────────────────────────────────────────────

  type ProficiencyLevel = 'none' | 'proficient' | 'expert'

  const getEffectiveProficiency = (skillKey: string): ProficiencyLevel => {
    const entries = characterSheet?.value?.skills?.filter(s => s.skillKey === skillKey) || []
    if (entries.some(s => s.proficiencyLevel === 'expert')) return 'expert'
    if (entries.some(s => s.proficiencyLevel === 'proficient')) return 'proficient'
    return 'none'
  }

  const getSkillModifier = (abilityId: string, skillKey: string): number => {
    const base = abilityModifiers.value[abilityId] ?? 0
    const proficiency = getEffectiveProficiency(skillKey)
    const prof = deps?.proficiencyBonus.value ?? 2
    if (proficiency === 'expert') return base + prof * 2
    if (proficiency === 'proficient') return base + prof
    return base
  }

  const savingThrows = computed(() =>
    Object.fromEntries(
      Object.keys(abilityModifiers.value).map((abilityId) => {
        const saveKey = `${abilityId}_save`
        const proficiency = getEffectiveProficiency(saveKey)
        const base = abilityModifiers.value[abilityId] ?? 0
        const prof = deps?.proficiencyBonus.value ?? 2
        const modifier = proficiency !== 'none' ? base + prof : base
        return [abilityId, { modifier, proficiency }]
      }),
    ),
  )

  const passivePerception = computed(() => 10 + getSkillModifier('wis', 'perception'))

  const initiativeBonus = computed<number>(() => abilityModifiers.value.dex || 0)

  return {
    abilityScores,
    abilityModifiers,
    abilitySkillKeys,
    speciesAbilityScoreBonuses,
    getEffectiveProficiency,
    getSkillModifier,
    savingThrows,
    passivePerception,
    initiativeBonus,
  }
}
