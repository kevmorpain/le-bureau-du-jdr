import { resolvePreferences, type PreferenceKey, type Preferences } from '~~/shared/rules/preferences'

export const useCharacterPreferences = (characterSheet?: Ref<CharacterSheet>) => {
  const ownPreferences = computed<Preferences | null>(() => characterSheet?.value?.preferences ?? null)
  const accountPreferences = computed<Preferences | null>(() => characterSheet?.value?.owner?.preferences ?? null)

  // Résolu ici avec la fonction partagée plutôt que lu dans le GET : une valeur résolue côté serveur serait périmée au premier basculement.
  const preferences = computed(() => resolvePreferences(ownPreferences.value, accountPreferences.value))

  // `null` rend la main au compte. Mutation en place de la fiche (pas de réassignation de `.value`), comme `sheetTextField`.
  const setPreference = (key: PreferenceKey, value: boolean | null) => {
    const sheet = characterSheet?.value
    if (!sheet) return
    const { [key]: _replaced, ...others } = ownPreferences.value ?? {}
    const next: Preferences = value === null ? others : { ...others, [key]: value }
    sheet.preferences = Object.keys(next).length ? next : null
  }

  return { preferences, ownPreferences, accountPreferences, setPreference }
}
