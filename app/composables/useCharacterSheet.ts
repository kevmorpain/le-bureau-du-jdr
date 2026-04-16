import { useStorage } from '@vueuse/core'
import { evaluate } from '~~/shared/utils/formula'
import type { FormulaContext } from '~~/shared/utils/formula'

export const useCharacterSheet = (characterSheet: Ref<CharacterSheet>) => {
  const species = computed(() => characterSheet.value.species)
  const speed = computed<number>(() => species.value?.speed ?? 0)

  const characterClasses = computed(() => characterSheet.value.classes?.map((cls) => {
    const { class: classInfo, ...rest } = cls

    return {
      ...rest,
      ...classInfo,
    }
  }) || [])

  const characterLevel = computed<number>(() => characterClasses.value.reduce<number>((acc, cls) => acc + cls.level, 0))

  const mainClass = computed(() => characterClasses.value.find(cls => cls.isMain)!)
  const multiClass = computed(() => characterClasses.value.filter(cls => !cls.isMain))

  const hitDice = computed(() =>
    Object.entries(
      characterClasses.value.reduce<Record<string, number>>((acc, cls) => {
        acc[cls.hitDice!] = (acc[cls.hitDice!] ?? 0) + cls.level
        return acc
      }, {}),
    ).map(([hitDie, count]) => ({ hitDie: hitDie.slice(1), count })),
  )

  const characterAbilityScores = computed(() => characterSheet.value.baseAbilityScores?.reduce<Record<string, number>>((acc, abs) => {
    acc[abs.abilityId] = abs.value

    return acc
  }, {}) || {})

  const getAbilityScore = (abilityId: string): number => {
    return characterAbilityScores.value[abilityId] || 10
  }

  const abilityScoreOrder = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  const speciesTraits = computed(() => species.value?.speciesFeatures?.flatMap(sf => sf.feature!) || [])

  const speciesEffects = computed(() => {
    const effects: Effect[] = []

    speciesTraits.value.forEach((feature) => {
      if (feature?.featureEffects) {
        feature.featureEffects.forEach((fe) => {
          if (fe.effect) {
            effects.push(fe.effect as Effect)
          }
        })
      }
    })

    return effects
  })

  const speciesAbilityScoreBonuses = computed(() => {
    const bonuses: Record<string, number> = {}

    speciesEffects.value.forEach((effect) => {
      if (effect.type === 'ability_increase') {
        const { ability, amount } = effect.value

        if (bonuses[ability]) {
          bonuses[ability]! += amount
        } else {
          bonuses[ability] = amount
        }
      }
    })

    return bonuses
  })

  // TODO: should be total with all bonuses
  const abilityScores = computed<Record<string, { base: number, speciesBonus: number, total: number }>>(() => abilityScoreOrder.reduce<Record<string, { base: number, speciesBonus: number, total: number }>>((acc, abilityId) => {
    const base = getAbilityScore(abilityId)
    const speciesBonus = speciesAbilityScoreBonuses.value[abilityId] || 0
    acc[abilityId] = {
      base,
      speciesBonus,
      total: base + speciesBonus,
    }

    return acc
  }, {}))

  const abilityModifiers = computed<Record<string, number>>(() => Object.entries(abilityScores.value!).reduce<Record<string, number>>((acc, [key, abilityScore]) => {
    acc[key] = Math.floor((abilityScore.total - 10) / 2)

    return acc
  }, {}))

  const proficiencyBonus = computed<number>(() => {
    return Math.floor((characterLevel.value - 1) / 4) + 2
  })

  const armorClass = useStorage<number>('armorClass', 10)

  const initiativeBonus = computed<number>(() => {
    return abilityModifiers.value.dex || 0
  })

  const spellcastingAbility = useStorage<string | null>('spellcastingAbility', null)

  const spellcastingModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    return abilityModifiers.value[spellcastingAbility.value]!
  })

  const spellSaveDC = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null

    return 8 + proficiencyBonus.value + abilityModifiers.value[spellcastingAbility.value]!
  })

  const spellAttackModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null

    return proficiencyBonus.value + abilityModifiers.value[spellcastingAbility.value]!
  })

  const spellSlots = useStorage<Record<number, { max: number, current: number }>>('spellSlots', {
    1: { max: 0, current: 0 },
    2: { max: 0, current: 0 },
    3: { max: 0, current: 0 },
    4: { max: 0, current: 0 },
    5: { max: 0, current: 0 },
    6: { max: 0, current: 0 },
    7: { max: 0, current: 0 },
    8: { max: 0, current: 0 },
    9: { max: 0, current: 0 },
  })

  const availableSpellSlots = computed(() => {
    return Object.entries(spellSlots.value).reduce<number[]>((acc, [level, slots]) => {
      if (slots.max > 0 && slots.current < slots.max) {
        acc.push(Number(level))
      }

      return acc
    }, [])
  })

  const abilitySkillKeys: Record<string, string[]> = {
    str: ['athletics'],
    dex: ['acrobatics', 'sleight_of_hand', 'stealth'],
    con: [],
    int: ['arcana', 'history', 'investigation', 'nature', 'religion'],
    wis: ['animal_handling', 'insight', 'medicine', 'perception', 'survival'],
    cha: ['deception', 'intimidation', 'performance', 'persuasion'],
  }

  type ProficiencyLevel = 'none' | 'proficient' | 'expert'

  const getEffectiveProficiency = (skillKey: string): ProficiencyLevel => {
    const entries = characterSheet.value.skills?.filter(s => s.skillKey === skillKey) || []
    if (entries.some(s => s.proficiencyLevel === 'expert')) return 'expert'
    if (entries.some(s => s.proficiencyLevel === 'proficient')) return 'proficient'
    return 'none'
  }

  const getSkillModifier = (abilityId: string, skillKey: string): number => {
    const base = abilityModifiers.value[abilityId] ?? 0
    const proficiency = getEffectiveProficiency(skillKey)
    if (proficiency === 'expert') return base + proficiencyBonus.value * 2
    if (proficiency === 'proficient') return base + proficiencyBonus.value
    return base
  }

  const savingThrows = computed(() =>
    Object.fromEntries(
      Object.keys(abilityModifiers.value).map((abilityId) => {
        const saveKey = `${abilityId}_save`
        const proficiency = getEffectiveProficiency(saveKey)
        const base = abilityModifiers.value[abilityId] ?? 0
        const modifier = proficiency !== 'none' ? base + proficiencyBonus.value : base
        return [abilityId, { modifier, proficiency }]
      }),
    ),
  )

  const passivePerception = computed(() => {
    return 10 + getSkillModifier('wis', 'perception')
  })

  const formulaContext = computed<FormulaContext>(() => ({
    level: characterLevel.value,
    class_level: mainClass.value?.level ?? characterLevel.value,
    prof_bonus: proficiencyBonus.value,
    str_mod: abilityModifiers.value.str ?? 0,
    dex_mod: abilityModifiers.value.dex ?? 0,
    con_mod: abilityModifiers.value.con ?? 0,
    int_mod: abilityModifiers.value.int ?? 0,
    wis_mod: abilityModifiers.value.wis ?? 0,
    cha_mod: abilityModifiers.value.cha ?? 0,
  }))

  const resolvedFeatures = computed(() =>
    (characterSheet.value.features ?? []).map((cf) => {
      const feature = cf.feature!
      const maxUses = feature.maxUsesFormula
        ? evaluate(feature.maxUsesFormula, formulaContext.value)
        : null
      return {
        ...feature,
        currentUses: cf.currentUses,
        maxUses,
        effects: feature.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? [],
      }
    }),
  )

  const formatModifier = (modifier: number | null): string => {
    if (modifier === null) return '-'
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  const deathSavingThrows = ref<{ success: number, failure: number }>({ success: 0, failure: 0 })

  return {
    abilityScores,
    abilityModifiers,
    abilitySkillKeys,
    availableSpellSlots,
    characterLevel,
    deathSavingThrows,
    getEffectiveProficiency,
    getSkillModifier,
    hitDice,
    initiativeBonus,
    mainClass,
    multiClass,
    passivePerception,
    proficiencyBonus,
    savingThrows,
    spellcastingAbility,
    spellcastingModifier,
    spellAttackModifier,
    spellSaveDC,
    spellSlots,
    species,
    armorClass,
    speciesEffects,
    speciesAbilityScoreBonuses,
    speciesTraits,
    speed,
    resolvedFeatures,
    formatModifier,
  }
}
