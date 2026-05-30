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

export type ProficiencyLevel = 'none' | 'proficient' | 'expert'

const proficiencyPriority: Record<ProficiencyLevel, number> = { none: 0, proficient: 1, expert: 2 }

// ─── Composable ──────────────────────────────────────────────────────────────

export const useCharacterAbilities = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    speciesEffects: ComputedRef<Effect[]>
    featureEffects: ComputedRef<Effect[]>
    asiEffects: ComputedRef<Effect[]>
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

  // ─── Ability bonuses par source ───────────────────────────────────────────

  const sumAbilityIncreases = (effects: Effect[] | undefined): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const e of effects ?? []) {
      if (e.type === 'ability_increase') {
        out[e.value.ability] = (out[e.value.ability] ?? 0) + e.value.amount
      }
    }
    return out
  }

  const speciesBonuses = computed(() => sumAbilityIncreases(deps?.speciesEffects.value))
  const featureBonuses = computed(() => sumAbilityIncreases(deps?.featureEffects.value))
  const asiBonuses = computed(() => sumAbilityIncreases(deps?.asiEffects.value))

  // ─── Computed scores & modifiers ──────────────────────────────────────────

  type AbilityScore = { base: number, species: number, feature: number, asi: number, bonus: number, total: number }

  const abilityScores = computed<Record<string, AbilityScore>>(() =>
    abilityScoreOrder.reduce<Record<string, AbilityScore>>((acc, abilityId) => {
      const base = getAbilityScore(abilityId)
      const species = speciesBonuses.value[abilityId] ?? 0
      const feature = featureBonuses.value[abilityId] ?? 0
      const asi = asiBonuses.value[abilityId] ?? 0
      const bonus = species + feature + asi
      acc[abilityId] = { base, species, feature, asi, bonus, total: base + bonus }
      return acc
    }, {}),
  )

  const abilityScoreBonuses = computed(() => {
    const out: Record<string, number> = {}
    for (const id of abilityScoreOrder) out[id] = abilityScores.value[id]!.bonus
    return out
  })

  const abilityModifiers = computed<Record<string, number>>(() =>
    Object.entries(abilityScores.value).reduce<Record<string, number>>((acc, [key, abilityScore]) => {
      acc[key] = Math.floor((abilityScore.total - 10) / 2)
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
    // Skill proficiencies granted by species or feature effects (e.g. half-orc Menaçant → Intimidation)
    const effectSources = [...(deps?.speciesEffects.value ?? []), ...(deps?.featureEffects.value ?? [])]
    for (const e of effectSources) {
      if (e.type === 'skill_proficiency') {
        const skill = (e.value as { skill: string }).skill
        if (!map.has(skill) || proficiencyPriority['proficient'] > proficiencyPriority[map.get(skill)!]) {
          map.set(skill, 'proficient')
        }
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

  // ─── Bonus issus des dons / effets ───────────────────────────────────────

  const sumPassiveBonus = (skill: 'perception' | 'investigation'): number => {
    let total = 0
    for (const e of deps?.featureEffects.value ?? []) {
      if (e.type === 'passive_skill_bonus' && (e.value as { skill: string }).skill === skill) {
        total += (e.value as { amount: number }).amount
      }
    }
    return total
  }

  const initiativeFlatBonus = computed<number>(() => {
    let total = 0
    for (const e of deps?.featureEffects.value ?? []) {
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
    passivePerception,
    passiveInvestigation,
    initiativeBonus,
    hpBonusFromFeats,
  }
}
