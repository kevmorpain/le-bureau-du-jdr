<template>
  <UForm
    class="space-y-4 w-full max-w-2xl"
    :state="spell"
    @submit="handleFormSubmit"
  >
    <UFormField :label="$t('new_spell.name')">
      <UInput v-model="spell.name" />
    </UFormField>

    <UFormField :label="$t('new_spell.level')">
      <UInputNumber
        v-model="spell.level"
        :min="0"
        :max="9"
      />
    </UFormField>

    <UFormField :label="$t('new_spell.magic_school')">
      <USelect
        v-model="spell.schoolId"
        class="w-48"
        :items="magicSchoolsItems"
        value-key="id"
      />
    </UFormField>

    <UFormField :label="$t('new_spell.casting_time')">
      <UInput v-model="spell.castingTime" />
    </UFormField>

    <UFormField :label="$t('new_spell.range')">
      <UInput
        v-model="spell.range"
        type="number"
      />
    </UFormField>

    <UFormField :label="$t('new_spell.components')">
      <USelect
        v-model="spell.components"
        class="w-48"
        :items="componentItems"
        value-key="id"
        multiple
      />
    </UFormField>

    <UFormField
      v-if="spell.components?.includes(SpellComponent.Material)"
      :label="$t('new_spell.material')"
    >
      <UTextarea v-model="spell.material" />
    </UFormField>

    <UFormField :label="$t('new_spell.duration')">
      <UInput v-model="spell.duration" />
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
      <UTextarea v-model="spell.description" />
    </UFormField>

    <UButton type="submit">
      {{ $t('new_spell.submit') }}
    </UButton>
  </UForm>
</template>

<script lang="ts" setup>
import type { InsertSpell, MagicSchool } from '~~/server/utils/drizzle'
import { SpellComponent } from '~~/server/database/schema/spells'

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

const handleFormSubmit = async () => {
  await $fetch<InsertSpell>('/api/spells', {
    method: 'POST',
    body: spell.value,
  })
}
</script>
