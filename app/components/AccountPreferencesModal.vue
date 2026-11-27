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
          :disabled="!isLoaded"
          @update:model-value="value => save(key, value)"
        />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import { PREFERENCES, PREFERENCE_KEYS } from '~~/shared/rules/preferences'

const open = defineModel<boolean>('open', { default: false })

const { resolved, isLoaded, error, load, save } = useAccountPreferences()

watch(open, (isOpen) => {
  if (isOpen) void load()
})

const ERROR_TITLES = { load: 'Impossible de lire les préférences', save: 'Préférence non enregistrée' } as const
watch(error, (value) => {
  if (value) useToast().add({ title: ERROR_TITLES[value], color: 'error' })
})
</script>
