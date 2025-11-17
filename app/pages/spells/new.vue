<template>
  <UPageHeader :title="$t('new_spell.title')" />

  <UPageBody>
    <UForm
      class="space-y-4 w-full max-w-2xl mx-auto"
      :state="spell"
      @submit="handleFormSubmit"
    >
      <UFormField :label="$t('new_spell.name')">
        <UInput v-model="spell.name" />
      </UFormField>

      <div class="grid grid-cols-2 items-center space-x-4">
        <UFormField :label="$t('new_spell.magic_school')">
          <USelect
            v-model="spell.schoolId"
            :items="magicSchoolsItems"
            value-key="id"
          />
        </UFormField>

        <UFormField :label="$t('new_spell.level')">
          <UInputNumber
            v-model="spell.level"
            :min="0"
            :max="9"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 items-center space-x-4">
        <UFormField :label="$t('new_spell.casting_time')">
          <UInput v-model="spell.castingTime" />
        </UFormField>

        <UFormField :label="$t('new_spell.range')">
          <UInput
            v-model="spell.range"
            type="number"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-2 items-center space-x-4">
        <UFormField :label="$t('new_spell.components')">
          <USelect
            v-model="spell.components"
            :items="componentItems"
            value-key="id"
            multiple
          />
        </UFormField>

        <UFormField :label="$t('new_spell.duration')">
          <UInput v-model="spell.duration" />
        </UFormField>
      </div>

      <UFormField
        v-if="spell.components?.includes(SpellComponent.Material)"
        :label="$t('new_spell.material')"
      >
        <UTextarea
          v-model="spell.material"
          :rows="1"
        />
      </UFormField>

      <UCheckbox
        v-model="spell.ritual"
        :label="$t('new_spell.ritual')"
      />

      <UCheckbox
        v-model="spell.concentration"
        :label="$t('new_spell.concentration')"
      />

      <UFormField :label="$t('new_spell.description')">
        <UTextarea
          v-model="spell.description"
          :rows="10"
        />
      </UFormField>

      <div class="text-center">
        <UButton type="submit">
          {{ $t('new_spell.submit') }}
        </UButton>
      </div>
    </UForm>
  </UPageBody>
</template>

<script lang="ts" setup>
import type { InsertSpell, MagicSchool } from '~~/server/utils/drizzle'
import { SpellComponent } from '~~/server/database/schema/spells'
import { FetchError } from 'ofetch'
import type { core } from 'zod/v4'

const { t } = useI18n()

const componentItems = computed<{
  label: string
  id: SpellComponent
}[]>(() => Object.entries(SpellComponent).map(([label, id]) => ({
  label: t(`new_spell.components_options.${label}`),
  id,
})))

const { data: magicSchools } = await useFetch<MagicSchool[]>('/api/magic_schools')

const magicSchoolsItems = computed<{
  label: string
  id: number
}[]>(() => {
  return magicSchools.value?.map(school => ({
    label: t(`schools.${school.name}`),
    id: school.id,
  })) ?? []
})

const spell = ref<InsertSpell>({
  name: '',
  level: 0,
  components: [],
  material: '',
  ritual: false,
  castingTime: '',
  range: 0,
  duration: '',
  concentration: false,
  description: '',
  schoolId: 1,
})

const toaster = useToast()

const handleFormSubmit = async () => {
  try {
    await $fetch<InsertSpell>('/api/spells', {
      method: 'POST',
      body: spell.value,
    })

    toaster.add({
      title: $t('toasts.insert_spell.success'),
      color: 'success',
    })
  } catch (error) {
    if (error instanceof FetchError) {
      console.log(error.data)
      const issues = (error.data.data.issues) as core.$ZodIssue[]

      issues.forEach((issue) => {
        console.log(issue.message, issue.path.map(p => toSnakeCase(String(p))).join('.'))
      })

      toaster.add({
        title: $t('toasts.insert_spell.error'),
        description: t('toasts.insert_spell.422'),
        color: 'error',
      })
    } else {
      toaster.add({
        title: $t('toasts.insert_spell.error'),
        description: error instanceof Error ? error.message : String(error),
        color: 'error',
      })
    }
  }
}
</script>
