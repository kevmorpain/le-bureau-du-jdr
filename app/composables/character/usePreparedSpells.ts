import { classSlugFromName } from '~~/shared/rules/classSlugs'
import { countPreparedSpells, preparedSpellsLimit } from '~~/shared/rules/spellsKnown'

type PreparedSpellsDeps = Pick<ReturnType<typeof useCharacterSheet>, 'activeCasterClass' | 'statsForCasterClass' | 'characterSpells'>

// Limit and count of the active caster class: null when that class prepares no spells.
export const usePreparedSpells = (characterSheet: Ref<CharacterSheet>, { activeCasterClass, statsForCasterClass, characterSpells }: PreparedSpellsDeps) => {
  const preparedLimit = computed<number | null>(() => {
    const caster = activeCasterClass.value
    const slug = caster ? classSlugFromName(caster.className) : undefined
    const classLevel = characterSheet.value.classes?.find(cls => cls.classId === caster?.classId)?.level
    if (!caster || !slug || !classLevel) return null
    return preparedSpellsLimit(characterSheet.value.ruleset, slug, classLevel, statsForCasterClass(caster.classId)?.modifier ?? 0)
  })

  const preparedCount = computed(() => {
    const caster = activeCasterClass.value
    if (!caster) return 0
    return countPreparedSpells((characterSpells.value ?? []).map(cs => ({ ...cs, level: cs.spell.level })), caster.classId)
  })

  return { preparedLimit, preparedCount }
}
