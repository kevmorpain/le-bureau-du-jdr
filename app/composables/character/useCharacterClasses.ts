import { useStorage } from '@vueuse/core'
import type { Effect } from '~~/server/db/schema/effects'

export const useCharacterClasses = (characterSheet?: Ref<CharacterSheet>) => {
  const storageKey = (suffix: string) => characterStorageKey(characterSheet?.value?.id, suffix)

  // ─── Species ──────────────────────────────────────────────────────────────

  const species = computed(() => characterSheet?.value?.species)
  const speed = computed<number>(() => species.value?.speed ?? 0)

  const speciesTraits = computed(() => species.value?.speciesFeatures?.flatMap(sf => sf.feature!) || [])

  const speciesEffects = computed<Effect[]>(() =>
    speciesTraits.value.flatMap(f =>
      (f?.featureEffects ?? []).map(fe => fe.effect).filter(Boolean),
    ) as Effect[],
  )

  // ─── Classes ──────────────────────────────────────────────────────────────

  const characterClasses = computed(() =>
    characterSheet?.value?.classes?.map((cls) => {
      const { class: classInfo, ...rest } = cls
      return { ...rest, ...classInfo }
    }) || [],
  )

  const characterLevel = computed<number>(() =>
    characterClasses.value.reduce<number>((acc, cls) => acc + cls.level, 0),
  )

  const mainClass = computed(() => characterClasses.value.find(cls => cls.isMain))
  const multiClass = computed(() => characterClasses.value.filter(cls => !cls.isMain))

  const hitDice = computed(() =>
    Object.entries(
      characterClasses.value.reduce<Record<string, number>>((acc, cls) => {
        acc[cls.hitDice!] = (acc[cls.hitDice!] ?? 0) + cls.level
        return acc
      }, {}),
    ).map(([hitDie, count]) => ({ hitDie: hitDie.slice(1), count })),
  )

  const proficiencyBonus = computed<number>(() => Math.floor((characterLevel.value - 1) / 4) + 2)

  // ─── Combat stats (storage) ───────────────────────────────────────────────

  const armorClass = useStorage<number>(storageKey('armorClass'), 10)
  const deathSavingThrows = useStorage(storageKey('deathSavingThrows'), { success: 0, failure: 0 })

  return {
    species,
    speed,
    speciesTraits,
    speciesEffects,
    characterClasses,
    characterLevel,
    mainClass,
    multiClass,
    hitDice,
    proficiencyBonus,
    armorClass,
    deathSavingThrows,
  }
}
