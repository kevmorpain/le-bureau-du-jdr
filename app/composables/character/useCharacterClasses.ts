import { useStorage } from '@vueuse/core'
import { hitDiceTotals } from '~~/shared/rules/hitDice'

export const useCharacterClasses = (characterSheet?: Ref<CharacterSheet>) => {
  const storageKey = (suffix: string) => characterStorageKey(characterSheet?.value?.id, suffix)

  // ─── Species ──────────────────────────────────────────────────────────────

  const species = computed(() => characterSheet?.value?.species)
  const speed = computed<number>(() => species.value?.speed ?? 0)

  const speciesTraits = computed(() => species.value?.speciesFeatures?.flatMap(sf => sf.feature!) || [])

  // ─── Classes ──────────────────────────────────────────────────────────────

  const characterClasses = computed(() =>
    characterSheet?.value?.classes?.map((cls) => {
      const { class: classInfo, subclass, ...rest } = cls
      const effectiveSpellcastingAbility = subclass?.spellcastingAbility
        ?? classInfo?.spellcastingAbility
        ?? null
      return {
        ...rest,
        ...classInfo,
        class: classInfo,
        subclass,
        effectiveSpellcastingAbility,
      }
    }) || [],
  )

  const characterLevel = computed<number>(() =>
    characterClasses.value.reduce<number>((acc, cls) => acc + cls.level, 0),
  )

  const mainClass = computed(() => characterClasses.value.find(cls => cls.isMain))
  const multiClass = computed(() => characterClasses.value.filter(cls => !cls.isMain))

  const hitDice = computed(() =>
    hitDiceTotals(characterClasses.value).map(({ die, count }) => ({ hitDie: die, count })),
  )

  const proficiencyBonus = computed<number>(() => Math.floor((characterLevel.value - 1) / 4) + 2)

  // ─── Combat stats (storage) ───────────────────────────────────────────────

  const deathSavingThrows = useStorage(storageKey('deathSavingThrows'), { success: 0, failure: 0 })

  return {
    species,
    speed,
    speciesTraits,
    characterClasses,
    characterLevel,
    mainClass,
    multiClass,
    hitDice,
    proficiencyBonus,
    deathSavingThrows,
  }
}
