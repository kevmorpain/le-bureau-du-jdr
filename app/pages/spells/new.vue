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

      <div class="flex items-center gap-x-2">
        <p>{{ $t('new_spell.dc.label') }}</p>

        <UButton
          type="button"
          color="neutral"
          variant="soft"
          :icon="isDcVisible ? 'heroicons:minus' : 'heroicons:plus'"
          class="rounded-full"
          size="xs"
          @click="isDcVisible ? clearDc() : initDc()"
        />
      </div>

      <div
        v-if="isDcVisible"
        class="grid grid-cols-2 items-center space-x-4 bg-muted p-4 rounded-md"
      >
        <UFormField :label="$t('new_spell.dc.ability_score_label')">
          <USelect
            v-model="spell.dc!.ability"
            :items="abilityScores"
            value-key="id"
          />
        </UFormField>

        <UFormField :label="$t('new_spell.dc.success_effect_label')">
          <USelect
            v-model="spell.dc!.success"
            :items="successEffectOptions"
            value-key="id"
          />
        </UFormField>
      </div>

      <div class="flex items-center gap-x-2">
        <p>{{ $t('new_spell.damage.label') }}</p>

        <UButton
          type="button"
          color="neutral"
          variant="soft"
          :icon="isDamageCollapsibleVisible ? 'heroicons:minus' : 'heroicons:plus'"
          class="rounded-full"
          size="xs"
          @click="isDamageCollapsibleVisible ? clearDamage() : initDamage()"
        />
      </div>

      <div
        v-if="isDamageCollapsibleVisible"
        class="grid grid-cols-2 items-center space-x-4 bg-muted p-4 rounded-md"
      >
        <UFormField :label="$t('new_spell.damage.type_label')">
          <USelect
            v-model="spell.damage!.damage_type"
            :items="damageTypesOptions"
            value-key="id"
          />
        </UFormField>

        <UFormField :label="$t('new_spell.damage.which_level_label')">
          <USelect
            v-model="damageLevelKind"
            :items="successEffectOptions"
            value-key="id"
          />
        </UFormField>
      </div>

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
import { AbilityScore, DamageType, SpellComponent } from '~~/server/database/schema/spells'
import { FetchError } from 'ofetch'
import type { core } from 'zod/v4'

const { rt, t, tm } = useI18n()

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

const abilityScores = computed<{
  label: string
  id: AbilityScore
}[]>(() => Object.entries(tm('ability_scores')).map(([value, label]) => ({
  label: rt(label),
  id: value as AbilityScore,
})))

const successEffectOptions = computed<{
  label: string
  id: string
}[]>(() => Object.entries(tm('new_spell.dc.success_effect_options')).map(([value, label]) => ({
  label: rt(label),
  id: value,
})))

const damageTypesOptions = computed<{
  label: string
  id: string
}[]>(() => Object.entries(tm('damage_types')).map(([value, label]) => ({
  label: rt(label).charAt(0).toUpperCase() + rt(label).slice(1),
  id: value,
})))

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
  dc: null,
  damage: null,
  heal: null,
})

const isDcVisible = ref(false)

const initDc = () => {
  isDcVisible.value = true
  spell.value.dc = {
    ability: AbilityScore.Strength,
    success: undefined,
  }
}

const clearDc = () => {
  isDcVisible.value = false
  spell.value.dc = null
}

const isDamageCollapsibleVisible = ref(false)
const damageLevelKinds = ['character_level', 'slot_level'] as const
const damageLevelKind = ref<typeof damageLevelKinds[number]>(damageLevelKinds[0])

const initDamage = () => {
  isDamageCollapsibleVisible.value = true
  spell.value.damage = {
    damage_type: DamageType.Acid,
    damage_at_character_level: {},
  }
}

const clearDamage = () => {
  isDamageCollapsibleVisible.value = false
  spell.value.damage = null
}

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
