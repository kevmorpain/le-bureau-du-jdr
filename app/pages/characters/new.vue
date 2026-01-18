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

      <UFormField :label="$t('new_character_sheet.classes')">
        <div class="space-y-3">
          <div
            v-if="classes.length === 0"
            class="text-muted"
          >
            {{ $t('new_character_sheet.no_classes') }}
          </div>

          <div
            v-for="(cls, index) in classes"
            :key="index"
            class="flex items-center gap-3"
          >
            <div class="flex-1">
              <p class="font-semibold">
                {{ cls.className }}
              </p>
              <p class="text-sm text-muted">
                {{ $t('new_character_sheet.level', { level: cls.level }) }}
              </p>
            </div>

            <UButton
              v-if="!cls.isMain"
              variant="ghost"
              size="sm"
              @click="setMainClass(index)"
            >
              {{ $t('new_character_sheet.set_main') }}
            </UButton>
            <div
              v-else
              class="text-sm font-semibold text-success"
            >
              {{ $t('new_character_sheet.main_class') }}
            </div>

            <UButton
              variant="ghost"
              size="sm"
              color="error"
              @click="removeClass(index)"
            >
              {{ $t('new_character_sheet.remove') }}
            </UButton>
          </div>

          <div class="flex gap-2 pt-2">
            <USelect
              v-model="selectedClassId"
              :items="availableClassesItems"
              value-key="value"
              placeholder="Select a class..."
              class="flex-1"
            />
            <UInput
              v-model.number="selectedLevel"
              type="number"
              placeholder="Level"
              min="1"
              max="20"
              class="w-20"
            />
            <UButton @click="addClass">
              {{ $t('new_character_sheet.add_class') }}
            </UButton>
          </div>
        </div>
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
import type { ClassItem, InsertCharacterSheet } from '~~/server/utils/drizzle'
import { Alignment } from '~~/server/db/schema/character_sheets'
import { FetchError } from 'ofetch'

interface CharacterClassInput {
  classId: number
  className: string
  level: number
  isMain: boolean
}

const { rt, t, tm } = useI18n()

const characterSheet = ref<InsertCharacterSheet>(
  {
    name: '',
    alignment: Alignment.TrueNeutral,
    speciesId: 1,
  },
)

const classes = ref<CharacterClassInput[]>([])
const selectedClassId = ref<number | null>(null)
const selectedLevel = ref<number>(1)

const { data: characterSpecies } = useFetch<CharacterSpecies[]>('/api/character_species')
const { data: classesData } = useFetch<ClassItem[]>('/api/classes')

const characterSpeciesItems = computed<{ label: string, value: number }[]>(() => {
  return characterSpecies.value?.map(species => ({
    label: species.name,
    value: species.id,
  })).toSorted((a, b) => a.label.localeCompare(b.label)) ?? []
})

const availableClassesItems = computed<{ label: string, value: number }[]>(() => {
  return classesData.value?.map(cls => ({
    label: cls.name,
    value: cls.id,
  })).toSorted((a, b) => a.label.localeCompare(b.label)) ?? []
})

const alignmentItems = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('alignments')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})

const addClass = () => {
  if (selectedClassId.value === null) return

  const selectedClass = classesData.value?.find(cls => cls.id === selectedClassId.value)
  if (!selectedClass) return

  // Check if class is already added
  if (classes.value.some(cls => cls.classId === selectedClassId.value)) {
    toaster.add({
      title: $t('toasts.class_already_added'),
      color: 'error',
    })
    return
  }

  const newClass: CharacterClassInput = {
    classId: selectedClassId.value,
    className: selectedClass.name,
    level: selectedLevel.value,
    isMain: classes.value.length === 0, // First class is main
  }

  classes.value.push(newClass)
  selectedClassId.value = null
  selectedLevel.value = 1
}

const removeClass = (index: number) => {
  classes.value.splice(index, 1)
  // If removed class was main and there are other classes, make the first one main
  if (classes.value.length > 0 && !classes.value.some(cls => cls.isMain)) {
    classes.value[0]!.isMain = true
  }
}

const setMainClass = (index: number) => {
  const mainClass = classes.value[index]!
  classes.value.splice(index, 1)
  classes.value.unshift(mainClass)

  classes.value.forEach((cls, i) => {
    cls.isMain = i === 0
  })
}

const toaster = useToast()

const handleFormSubmit = async () => {
  try {
    await $fetch<InsertCharacterSheet>('/api/character_sheets', {
      method: 'POST',
      body: {
        ...characterSheet.value,
        classes: classes.value.map(cls => ({
          classId: cls.classId,
          level: cls.level,
          isMain: cls.isMain,
        })),
      },
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
