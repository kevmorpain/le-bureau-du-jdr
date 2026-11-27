import { resolvePreferences, type PreferenceKey, type Preferences } from '~~/shared/rules/preferences'

type AccountPreferencesError = 'load' | 'save'

export const useAccountPreferences = ({ onSaved }: { onSaved?: (preferences: Preferences | null) => void } = {}) => {
  const preferences = ref<Preferences | null>(null)
  const isLoaded = ref(false)
  const error = ref<AccountPreferencesError | null>(null)
  const resolved = computed(() => resolvePreferences(null, preferences.value))

  const load = async () => {
    isLoaded.value = false
    error.value = null
    try {
      preferences.value = (await $fetch<{ preferences: Preferences | null }>('/api/account/preferences')).preferences
      isLoaded.value = true
    } catch {
      error.value = 'load'
    }
  }

  const save = async (key: PreferenceKey, value: boolean) => {
    error.value = null
    try {
      preferences.value = (await $fetch<{ preferences: Preferences | null }>('/api/account/preferences', {
        method: 'PUT',
        body: { ...preferences.value, [key]: value },
      })).preferences
      onSaved?.(preferences.value)
    } catch {
      error.value = 'save'
    }
  }

  return { preferences, resolved, isLoaded, error, load, save }
}
