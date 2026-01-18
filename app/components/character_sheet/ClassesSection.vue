<template>
  <USlideover
    v-model:open="open"
    :dismissible="false"
    title="Modification des classes"
  >
    <UButton
      color="primary"
      variant="link"
      size="sm"
    >
      Modifier la classe
    </UButton>

    <template #body>
      <div class="space-y-4">
        <ul class="space-y-4">
          <li
            v-for="(characterClass, index) in characterClassesInput"
            :key="index"
          >
            <div class="flex items-center justify-between gap-x-2">
              <UFormField
                :label="$t('classes_section.class_select_label')"
                class="flex-1"
              >
                <USelect
                  :items="classesItems"
                  value-key="value"
                  :model-value="characterClass.classId"
                  @update:model-value="(value) => characterClass.classId = value"
                />
              </UFormField>

              <UFormField :label="$t('classes_section.level_label')">
                <UInput
                  type="number"
                  min="0"
                  class="w-14"
                  :model-value="characterClass.level"
                  @update:model-value="(value) => characterClass.level = value"
                />
              </UFormField>

              <UButton
                class="self-end"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-x-mark"
                size="md"
                @click="characterClassesInput.splice(index, 1)"
              />
            </div>
          </li>
        </ul>

        <UButton
          color="primary"
          variant="link"
          @click="handleAddClass"
        >
          {{ $t('classes_section.add_class') }}
        </UButton>
      </div>
    </template>

    <template #footer>
      <UButton
        color="primary"
        @click="handleSubmit"
      >
        {{ $t('classes_section.submit_change') }}
      </UButton>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { CharacterClass, CharacterSheet, ClassItem } from '~~/server/utils/drizzle'

const { data: classes } = useFetch<ClassItem[]>('/api/classes')

const classesItems = computed<{ label: string, value: number }[]>(() => {
  return classes.value?.map(cls => ({
    label: cls.name,
    value: cls.id,
  })).toSorted((a, b) => a.label.localeCompare(b.label)) ?? []
})

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })

const characterClasses = computed(() => characterSheet.value.classes || [])

type CharacterClassInput = {
  level: number
  classId?: number
  isMain: boolean
}

const characterClassesInput = ref<CharacterClassInput[]>([])

const handleAddClass = () => {
  characterClassesInput.value.push({
    classId: undefined,
    level: 1,
    isMain: false,
  })
}

const open = ref(false)

watch(open, (newVal) => {
  if (newVal) {
    characterClassesInput.value = structuredClone(toRaw(characterClasses.value))
  } else {
    characterClassesInput.value = []
  }
})

const handleSubmit = () => {
  characterSheet.value.classes = characterClassesInput.value.map(input => ({
    classId: input.classId!,
    level: input.level,
    isMain: input.isMain,
    class: classes.value?.find(c => c.id === input.classId) || null,
  } as CharacterClass))

  open.value = false
}
</script>
