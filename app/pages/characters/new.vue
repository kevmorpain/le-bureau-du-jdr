<template>
  <UPageHeader :title="$t('new_character_sheet.title')" />

  <UPageBody>
    <UForm
      class="space-y-4 w-full max-w-2xl mx-auto"
      :state="characterSheet"
      @submit="handleFormSubmit"
    >
      <UFormField :label="$t('new_character_sheet.name')">
        <UInput v-model="characterSheet.name" />
      </UFormField>

      <UFormField :label="$t('new_character_sheet.species')">
        <USelect
          v-model="characterSheet.speciesId"
          :items="characterSpeciesItems"
          value-key="value"
        />
      </UFormField>

      <UFormField :label="$t('new_character_sheet.alignment')">
        <USelect
          v-model="characterSheet.alignment"
          :items="alignmentItems"
          value-key="value"
        />
      </UFormField>

      <div class="text-center">
        <UButton type="submit">
          {{ $t('new_character_sheet.submit') }}
        </UButton>
      </div>
    </UForm>
  </UPageBody>
</template>

<script lang="ts" setup>
import type { InsertCharacterSheet } from '~~/server/utils/drizzle'
import { Alignment } from '~~/server/db/schema/character_sheets'
import { FetchError } from 'ofetch'

const { rt, t, tm } = useI18n()

const characterSheet = ref<InsertCharacterSheet>(
  {
    name: '',
    alignment: Alignment.TrueNeutral,
    speciesId: 1,
  },
)

const { data: characterSpecies } = useFetch<CharacterSpecies[]>('/api/character_species')

const characterSpeciesItems = computed<{ label: string, value: number }[]>(() => {
  return characterSpecies.value?.map(species => ({
    label: species.name,
    value: species.id,
  })).toSorted((a, b) => a.label.localeCompare(b.label)) ?? []
})

const alignmentItems = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('alignments')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})

const toaster = useToast()

const handleFormSubmit = async () => {
  try {
    await $fetch<InsertCharacterSheet>('/api/character_sheets', {
      method: 'POST',
      body: characterSheet.value,
    })

    toaster.add({
      title: $t('toasts.insert_character_sheet.success'),
      color: 'success',
    })
  } catch (error) {
    if (error instanceof FetchError) {
      toaster.add({
        title: $t('toasts.insert_character_sheet.error'),
        description: t('toasts.insert_character_sheet.422'),
        color: 'error',
      })
    } else {
      toaster.add({
        title: $t('toasts.insert_character_sheet.error'),
        description: error instanceof Error ? error.message : String(error),
        color: 'error',
      })
    }
  }
}
</script>
