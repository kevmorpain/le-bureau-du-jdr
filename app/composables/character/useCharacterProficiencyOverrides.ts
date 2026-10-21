import type { ProficiencyOverrideAction, ProficiencyOverrideType } from '~~/shared/utils/proficiency_overrides'

type OverrideRow = NonNullable<CharacterSheet['proficiencyOverrides']>[number]

// Ajouts et retraits manuels de maîtrise, tous types confondus : lus dans la fiche, appliqués avant la synchro.
export const useCharacterProficiencyOverrides = (characterSheet?: Ref<CharacterSheet>) => {
  const characterId = computed(() => characterSheet?.value?.id)
  const { offlineMutate } = useOfflineMutation(() => characterId.value ?? 0)

  const proficiencyOverrides = computed<OverrideRow[]>(() => characterSheet?.value?.proficiencyOverrides ?? [])

  const withoutOverride = (proficiencyType: ProficiencyOverrideType, value: string) =>
    proficiencyOverrides.value.filter(o => !(o.proficiencyType === proficiencyType && o.value === value))

  const writeLocally = (rows: OverrideRow[]) => {
    if (characterSheet?.value) characterSheet.value.proficiencyOverrides = rows
  }

  const setProficiencyOverride = async (proficiencyType: ProficiencyOverrideType, value: string, action: ProficiencyOverrideAction) => {
    if (!characterId.value) return
    writeLocally([...withoutOverride(proficiencyType, value), { characterSheetId: characterId.value, proficiencyType, value, action }])
    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/proficiency-overrides`,
      method: 'PUT',
      body: { proficiencyType, value, action },
      dedupeKey: `prof:${proficiencyType}:${value}`,
      label: 'Maîtrises',
    })
  }

  const removeProficiencyOverride = async (proficiencyType: ProficiencyOverrideType, value: string) => {
    if (!characterId.value) return
    writeLocally(withoutOverride(proficiencyType, value))
    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/proficiency-overrides`,
      method: 'DELETE',
      body: { proficiencyType, value },
      dedupeKey: `prof:${proficiencyType}:${value}`,
      label: 'Maîtrises',
    })
  }

  return { proficiencyOverrides, setProficiencyOverride, removeProficiencyOverride }
}
