<template>
  <UModal
    v-model:open="open"
    title="Préférences du compte"
    description="Valables pour toutes vos fiches, sauf celles qui ont tranché pour elles-mêmes."
  >
    <template #body>
      <div class="space-y-4">
        <USwitch
          v-for="key in PREFERENCE_KEYS"
          :key
          :model-value="resolved[key]"
          :label="PREFERENCES[key].label"
          :description="PREFERENCES[key].description"
          :disabled="!loaded"
          @update:model-value="value => save(key, value)"
        />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { PREFERENCES, PREFERENCE_KEYS, resolvePreferences, type PreferenceKey, type Preferences } from '~~/shared/rules/preferences'

const open = defineModel<boolean>('open', { default: false })

const preferences = ref<Preferences | null>(null)
const loaded = ref(false)
const resolved = computed(() => resolvePreferences(null, preferences.value))

watch(open, async (isOpen) => {
  if (!isOpen) return
  loaded.value = false
  try {
    preferences.value = (await $fetch<{ preferences: Preferences | null }>('/api/account/preferences')).preferences
    loaded.value = true
  } catch {
    useToast().add({ title: 'Impossible de lire les préférences', color: 'error' })
  }
})

const save = async (key: PreferenceKey, value: boolean) => {
  try {
    preferences.value = (await $fetch<{ preferences: Preferences | null }>('/api/account/preferences', {
      method: 'PUT',
      body: { ...preferences.value, [key]: value },
    })).preferences
  } catch {
    useToast().add({ title: 'Préférence non enregistrée', color: 'error' })
  }
}
</script>
