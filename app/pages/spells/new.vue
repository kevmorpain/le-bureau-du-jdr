<template>
  <UForm
    class="space-y-4 w-full max-w-2xl"
    :state="spell"
    @submit="handleFormSubmit"
  >
    <UFormField label="Name">
      <UInput v-model="spell.name" />
    </UFormField>

    <UFormField label="Level">
      <UInputNumber
        v-model="spell.level"
        :min="0"
        :max="9"
      />
    </UFormField>

    <UFormField label="Magic School">
      <USelect
        v-model="spell.schoolId"
        class="w-48"
        :items="magicSchoolsItems"
        value-key="id"
      />
    </UFormField>

    <UFormField label="Casting time">
      <UInput v-model="spell.castingTime" />
    </UFormField>

    <UFormField label="Range">
      <UInput
        v-model="spell.range"
        type="number"
      />
    </UFormField>

    <UFormField label="Composants">
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
      label="Material"
    >
      <UTextarea v-model="spell.material" />
    </UFormField>

    <UFormField label="Duration">
      <UInput v-model="spell.duration" />
    </UFormField>

    <UCheckbox
      v-model="spell.ritual"
      label="Ritual"
    />

    <UCheckbox
      v-model="spell.concentration"
      label="Concentration"
    />

    <UFormField label="Description">
      <UTextarea v-model="spell.description" />
    </UFormField>

    <UButton type="submit">
      Submit
    </UButton>
  </UForm>
</template>

<script lang="ts" setup>
import type { InsertSpell, MagicSchool } from '~~/server/utils/drizzle'
import { SpellComponent } from '~~/server/database/schema/spells'

const componentItems = computed<{
  label: string
  id: SpellComponent
}[]>(() => Object.entries(SpellComponent).map(([label, id]) => ({
  label,
  id,
})))

const { data: magicSchools } = await useFetch<MagicSchool[]>('/api/magic_schools')

const magicSchoolsItems = computed<{
  label: string
  id: number
}[]>(() => {
  return magicSchools.value?.map(school => ({
    label: school.name,
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
